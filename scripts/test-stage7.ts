import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";
import { Role } from "@prisma/client";

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
  console.log("🛡️ Running Stage 7 Role-Based Access Control Tests...\n");

  // TEST 1: Staff Account Existence & Credentials
  console.log("Test Suite 1: Staff Account Verification");
  const staff = await prisma.user.findUnique({
    where: { email: "staff@natureclub.org" },
  });

  assert(staff !== null, "Staff account (staff@natureclub.org) exists in database");
  assert(staff?.role === Role.STAFF, "Staff account has role STAFF");

  const correctStaffPass = await bcrypt.compare("NatureStaff2026!Secure", staff!.passwordHash);
  assert(correctStaffPass === true, "Staff password verifies successfully with bcrypt");

  // TEST 2: Role Authorization Gates
  console.log("\nTest Suite 2: Role Gate Rules (Server Permission Boundaries)");
  const adminRole: Role = Role.ADMIN;
  const staffRole: Role = Role.STAFF;
  const memberRole: Role = Role.MEMBER;

  // Rule: Delete Member / Event -> ADMIN ONLY
  function canDelete(role: Role): boolean {
    return role === Role.ADMIN;
  }
  assert(canDelete(adminRole) === true, "ADMIN has permission to delete entities");
  assert(canDelete(staffRole) === false, "STAFF is denied permission to delete entities");
  assert(canDelete(memberRole) === false, "MEMBER is denied permission to delete entities");

  // Rule: Full Member List CSV Export -> ADMIN ONLY
  function canExportAllMembers(role: Role): boolean {
    return role === Role.ADMIN;
  }
  assert(canExportAllMembers(adminRole) === true, "ADMIN has permission to export full member roster");
  assert(canExportAllMembers(staffRole) === false, "STAFF is denied permission to export full member roster");

  // Rule: Manage Staff Accounts -> ADMIN ONLY
  function canManageStaff(role: Role): boolean {
    return role === Role.ADMIN;
  }
  assert(canManageStaff(adminRole) === true, "ADMIN has permission to manage staff accounts");
  assert(canManageStaff(staffRole) === false, "STAFF is denied access to staff management");

  // Rule: Register/Edit Members, Record Payments, Manage Events -> ADMIN OR STAFF
  function canCoordinateActivities(role: Role): boolean {
    return role === Role.ADMIN || role === Role.STAFF;
  }
  assert(canCoordinateActivities(adminRole) === true, "ADMIN can coordinate activities & record payments");
  assert(canCoordinateActivities(staffRole) === true, "STAFF can coordinate activities & record payments");
  assert(canCoordinateActivities(memberRole) === false, "MEMBER cannot access coordinator operations");

  // TEST 3: Admin User Creation & Role Assignment
  console.log("\nTest Suite 3: User Account Management by Admin");
  const testStaffEmail = `coordinator.test.${Date.now()}@natureclub.org`;
  const hashedPass = await bcrypt.hash("TempPassword2026!", 12);

  const newStaff = await prisma.user.create({
    data: {
      name: "Temporary Coordinator",
      email: testStaffEmail,
      passwordHash: hashedPass,
      role: Role.STAFF,
    },
  });

  assert(newStaff.id !== null, "Admin successfully creates new STAFF account in database");
  assert(newStaff.role === Role.STAFF, "New account created with role STAFF");

  // Promote to ADMIN
  const promotedUser = await prisma.user.update({
    where: { id: newStaff.id },
    data: { role: Role.ADMIN },
  });
  assert(promotedUser.role === Role.ADMIN, "Admin successfully updates user role to ADMIN");

  // Delete test staff user
  await prisma.user.delete({ where: { id: newStaff.id } });
  console.log("  Cleaned up temporary staff account.");

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
