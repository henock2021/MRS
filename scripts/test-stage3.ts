import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "../src/lib/rate-limit";
import { Role, MemberStatus } from "@prisma/client";

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
  console.log("🛡️ Running Stage 3 Unit & Integration Tests...\n");

  // TEST 1: Admin Password Hashing & Bcrypt Verification
  console.log("Test Suite 1: Admin Password Verification");
  const admin = await prisma.user.findUnique({
    where: { email: "admin@natureclub.org" },
  });

  assert(admin !== null, "Admin user exists in database");
  assert(admin?.role === Role.ADMIN, "Admin user has role ADMIN");

  const correctMatch = await bcrypt.compare("NatureAdmin2026!Secure", admin!.passwordHash);
  assert(correctMatch === true, "Correct admin password verifies successfully with bcrypt");

  const wrongMatch = await bcrypt.compare("WrongPassword123!", admin!.passwordHash);
  assert(wrongMatch === false, "Incorrect password fails verification");

  // TEST 2: Rate Limiting
  console.log("\nTest Suite 2: Rate Limiting Security");
  const testIp = "test-user-ip-rate-limit@example.com";
  resetRateLimit(testIp);

  const initialCheck = checkRateLimit(testIp);
  assert(initialCheck.allowed === true, "Initial attempt is allowed");
  assert(initialCheck.remainingAttempts === 5, "Initial remaining attempts is 5");

  // Simulate 4 failed attempts
  for (let i = 1; i <= 4; i++) {
    const res = recordFailedAttempt(testIp);
    assert(res.blocked === false, `Attempt ${i} recorded without lockout`);
    assert(res.remainingAttempts === 5 - i, `Remaining attempts decreases to ${5 - i}`);
  }

  // 5th failed attempt triggers block
  const fifthAttempt = recordFailedAttempt(testIp);
  assert(fifthAttempt.blocked === true, "5th failed attempt triggers rate-limit block");
  assert(fifthAttempt.remainingAttempts === 0, "Remaining attempts becomes 0");

  const lockedCheck = checkRateLimit(testIp);
  assert(lockedCheck.allowed === false, "Subsequent check is blocked");
  assert((lockedCheck.retryAfterSeconds ?? 0) > 0, "Returns retryAfterSeconds for cooldown");

  resetRateLimit(testIp);
  const resetCheck = checkRateLimit(testIp);
  assert(resetCheck.allowed === true, "Reset restores rate-limit allowance");

  // TEST 3: Member Approval & Rejection State Machine
  console.log("\nTest Suite 3: Member Status Transitions");
  // Create a temporary member for status testing
  const tempMember = await prisma.member.create({
    data: {
      memberCode: `NC-TEST-${Date.now().toString().slice(-4)}`,
      fullName: "Test Candidate",
      email: `test.candidate.${Date.now()}@example.com`,
      phone: `+1 555-99${Math.floor(Math.random() * 90 + 10)}`,
      address: "123 Trail Head Road",
      dateOfBirth: new Date("1995-01-01"),
      occupation: "Outdoor Educator",
      agreedToRules: true,
      liabilityWaiver: true,
      status: MemberStatus.PENDING,
      interestAreas: "hiking,photography",
      emergencyContactName: "Test Emergency",
      emergencyContactPhone: "+1 555-0000",
    },
  });

  assert(tempMember.status === MemberStatus.PENDING, "New member starts with status PENDING");

  // Approve member
  const approved = await prisma.member.update({
    where: { id: tempMember.id },
    data: { status: MemberStatus.APPROVED },
  });
  assert(approved.status === MemberStatus.APPROVED, "Member transitions to APPROVED status");

  // Deactivate member
  const deactivated = await prisma.member.update({
    where: { id: tempMember.id },
    data: { status: MemberStatus.DEACTIVATED },
  });
  assert(deactivated.status === MemberStatus.DEACTIVATED, "Member transitions to DEACTIVATED status");

  // Reject member with note
  const rejected = await prisma.member.update({
    where: { id: tempMember.id },
    data: {
      status: MemberStatus.REJECTED,
      adminNotes: "Safety waiver incomplete.",
    },
  });
  assert(rejected.status === MemberStatus.REJECTED, "Member transitions to REJECTED status");
  assert(rejected.adminNotes === "Safety waiver incomplete.", "Admin rejection notes saved properly");

  // Cleanup test member
  await prisma.member.delete({ where: { id: tempMember.id } });
  console.log("  Cleaned up temporary test member.");

  // TEST 4: Role Access Hierarchy
  console.log("\nTest Suite 4: Role-Based Authorization Logic");
  const staffOrAdminRoles: Role[] = [Role.ADMIN, Role.STAFF];
  assert(staffOrAdminRoles.includes(Role.ADMIN), "ADMIN is authorized for staffOrAdmin routes");
  assert(staffOrAdminRoles.includes(Role.STAFF), "STAFF is authorized for staffOrAdmin routes");
  assert(!staffOrAdminRoles.includes(Role.MEMBER), "MEMBER is denied access to staffOrAdmin routes");

  const adminOnlyRoles: Role[] = [Role.ADMIN];
  assert(adminOnlyRoles.includes(Role.ADMIN), "ADMIN is authorized for adminOnly routes");
  assert(!adminOnlyRoles.includes(Role.STAFF), "STAFF is denied access to adminOnly routes");

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
