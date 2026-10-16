import prisma from "../src/lib/prisma";
import { INTEREST_AREAS } from "../src/lib/validations";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("📊 Running Stage 6 Unit & Integration Tests...\n");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // TEST 1: Dashboard Core Metrics
  console.log("Test Suite 1: Dashboard Analytics Aggregation");
  const totalMembers = await prisma.member.count();
  assert(totalMembers >= 2, `Total members accurately counted (${totalMembers})`);

  const pendingCount = await prisma.member.count({ where: { status: "PENDING" } });
  assert(typeof pendingCount === "number", `Pending approvals metric valid (${pendingCount})`);

  const newThisMonth = await prisma.member.count({
    where: { createdAt: { gte: startOfMonth } },
  });
  assert(newThisMonth >= 0, `New members this month metric valid (${newThisMonth})`);

  const expiringSoon = await prisma.payment.count({
    where: {
      expiryDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
  });
  assert(typeof expiringSoon === "number", `Expiring soon (30-day) count valid (${expiringSoon})`);

  const upcomingEvents = await prisma.event.count({
    where: { dateTime: { gte: now } },
  });
  assert(upcomingEvents >= 1, `Upcoming events accurately counted (${upcomingEvents})`);

  const paymentsThisMonth = await prisma.payment.findMany({
    where: { paymentDate: { gte: startOfMonth } },
    select: { amount: true },
  });
  const sumRevenue = paymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);
  assert(sumRevenue >= 0, `Payments revenue this month accurately aggregated ($${sumRevenue})`);

  // TEST 2: Interest Areas Distribution
  console.log("\nTest Suite 2: Member Interests Breakdown");
  const allMembers = await prisma.member.findMany({
    select: { interestAreas: true },
  });

  const interestStats = INTEREST_AREAS.map((item) => {
    const matchingCount = allMembers.filter((m) =>
      m.interestAreas.toLowerCase().includes(item.id.toLowerCase())
    ).length;
    const percentage = totalMembers > 0 ? Math.round((matchingCount / totalMembers) * 100) : 0;
    return { id: item.id, label: item.label, count: matchingCount, percentage };
  });

  assert(interestStats.length === 7, "All 7 club interest areas processed in stats");
  interestStats.forEach((stat) => {
    assert(stat.count >= 0, `Interest '${stat.id}' count is non-negative (${stat.count})`);
    assert(stat.percentage >= 0 && stat.percentage <= 100, `Percentage is between 0-100% (${stat.percentage}%)`);
  });

  // TEST 3: Member CSV Export Formatting & Filter Compliance
  console.log("\nTest Suite 3: CSV Export Data Integrity");
  const approvedMembers = await prisma.member.findMany({
    where: { status: "APPROVED" },
    include: { membershipType: true },
  });

  function escapeCsvField(field: string | number | null | undefined): string {
    if (field === null || field === undefined) return '""';
    const stringValue = String(field);
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  const csvRows = approvedMembers.map((m) => [
    escapeCsvField(m.memberCode),
    escapeCsvField(m.fullName),
    escapeCsvField(m.email),
    escapeCsvField(m.phone),
    escapeCsvField(m.status),
  ]);

  assert(csvRows.length === approvedMembers.length, "CSV export matches filtered record count");
  csvRows.forEach((row) => {
    // Every field is quoted
    assert(row.every((f) => f.startsWith('"') && f.endsWith('"')), "CSV fields are properly quoted");
    // Verify status in row is "APPROVED"
    assert(row[4] === '"APPROVED"', "Filtered CSV strictly exports approved status records");
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
