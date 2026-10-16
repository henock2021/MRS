import prisma from "../src/lib/prisma";
import { getExpiryStatus, calculateExpiryDate } from "../src/lib/payment-utils";
import { PaymentMethod, MemberStatus } from "@prisma/client";

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
  console.log("💳 Running Stage 4 Unit & Integration Tests...\n");

  // TEST 1: Expiry Status Calculation & 30-Day Alert Logic
  console.log("Test Suite 1: Expiry Status & 30-Day Alert Utility");
  const now = new Date();

  // 1a. Active (>30 days away)
  const activeDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const activeStatus = getExpiryStatus(activeDate);
  assert(activeStatus.status === "ACTIVE", "60 days in future evaluates to ACTIVE");
  assert((activeStatus.daysRemaining ?? 0) > 30, "Days remaining is > 30");

  // 1b. Expiring Soon (<=30 days away)
  const expiringDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const expiringStatus = getExpiryStatus(expiringDate);
  assert(expiringStatus.status === "EXPIRING_SOON", "14 days in future evaluates to EXPIRING_SOON");
  assert((expiringStatus.daysRemaining ?? 0) <= 30 && (expiringStatus.daysRemaining ?? 0) >= 0, "Days remaining is within 30-day window");

  // 1c. Expired (in the past)
  const expiredDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const expiredStatus = getExpiryStatus(expiredDate);
  assert(expiredStatus.status === "EXPIRED", "10 days in past evaluates to EXPIRED");
  assert((expiredStatus.daysRemaining ?? 0) < 0, "Days remaining is negative");

  // 1d. Unpaid / Null
  const unpaidStatus = getExpiryStatus(null);
  assert(unpaidStatus.status === "UNPAID", "Null expiry date evaluates to UNPAID");

  // TEST 2: Calculate Expiry Date Helper
  console.log("\nTest Suite 2: Expiry Date Projection Helper");
  const startDate = new Date("2026-06-01T00:00:00Z");
  const calculated = calculateExpiryDate(startDate, 365);
  const expectedDate = new Date(startDate);
  expectedDate.setDate(expectedDate.getDate() + 365);
  assert(calculated.toDateString() === expectedDate.toDateString(), "365-day calculation correctly adds 1 year");

  // TEST 3: Membership Types CRUD in Database
  console.log("\nTest Suite 3: Membership Types Database Operations");
  const testTierName = `Senior-${Date.now().toString().slice(-4)}`;
  const createdTier = await prisma.membershipType.create({
    data: {
      name: testTierName,
      fee: 25.0,
      durationDays: 365,
      description: "Discounted access for nature lovers aged 65+.",
      isActive: true,
    },
  });
  assert(createdTier.name === testTierName, "New membership tier created successfully");
  assert(createdTier.fee === 25.0, "Tier fee stored accurately (25.0)");

  // Update tier fee and duration
  const updatedTier = await prisma.membershipType.update({
    where: { id: createdTier.id },
    data: { fee: 28.5, durationDays: 365 },
  });
  assert(updatedTier.fee === 28.5, "Tier fee updated accurately (28.5)");

  // Cleanup test tier
  await prisma.membershipType.delete({ where: { id: createdTier.id } });
  console.log("  Cleaned up temporary test tier.");

  // TEST 4: Recording Payments & Auto-Activating Status
  console.log("\nTest Suite 4: Payment Recording & Member Dues Tracking");
  // Find Liam Chen (NC-000102)
  const liam = await prisma.member.findUnique({
    where: { email: "liam.chen@example.com" },
    include: { membershipType: true },
  });
  assert(liam !== null, "Found test member Liam Chen");

  if (liam) {
    const paymentStart = new Date();
    const paymentExpiry = new Date(paymentStart.getTime() + 365 * 24 * 60 * 60 * 1000);

    const payment = await prisma.payment.create({
      data: {
        memberId: liam.id,
        amount: 15.0,
        paymentMethod: PaymentMethod.CASH,
        startDate: paymentStart,
        expiryDate: paymentExpiry,
        note: "Student annual dues paid in cash",
        recordedBy: "Admin Warden",
      },
    });

    assert(payment.id !== null, "Payment successfully created in database");
    assert(payment.amount === 15.0, "Payment amount matches ($15.0)");
    assert(payment.paymentMethod === PaymentMethod.CASH, "Payment method recorded as CASH");

    // Verify member has payment recorded
    const memberPayments = await prisma.payment.findMany({
      where: { memberId: liam.id },
    });
    assert(memberPayments.length >= 1, "Payment is linked to member record");

    // Clean up test payment
    await prisma.payment.delete({ where: { id: payment.id } });
    console.log("  Cleaned up test payment receipt.");
  }

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
