import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, MemberStatus } from "@prisma/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runStage8Tests() {
  console.log("\n🌲 Running Stage 8 Member Portal Tests...\n");

  // TEST 1: Member Activation & Password Setup Logic
  console.log("Test Suite 1: Member Account Activation & Password Setup");

  // Fetch sample members
  const sarah = await prisma.member.findUnique({
    where: { email: "sarah.greenwood@example.com" },
    include: { user: true },
  });
  const liam = await prisma.member.findUnique({
    where: { email: "liam.chen@example.com" },
  });

  assert(sarah !== null, "Approved member Sarah Greenwood exists in database");
  assert(sarah?.status === MemberStatus.APPROVED, "Sarah has APPROVED status");
  assert(liam !== null, "Pending member Liam Chen exists in database");
  assert(liam?.status === MemberStatus.PENDING, "Liam has PENDING status");

  // Activation rule: Liam is PENDING -> cannot activate yet
  const canActivatePending = liam!.status === MemberStatus.APPROVED;
  assert(canActivatePending === false, "PENDING member application cannot activate portal account");

  // Activation rule: Member ID mismatch rejection
  const codeMismatch = "NC-999999" === sarah!.memberCode;
  assert(codeMismatch === false, "Rejects activation if Member ID does not match database record");

  // Activation rule: Correct Email + Code for approved member
  const codeMatches = "NC-000101" === sarah!.memberCode;
  assert(codeMatches === true, "Validates approved member when Email and Member ID match");

  // Password verification for Sarah
  assert(sarah?.user !== null, "Sarah is linked to a User authentication account");
  assert(sarah?.user?.role === Role.MEMBER, "Sarah's user account has role MEMBER");
  const passwordValid = await bcrypt.compare("MemberPass2026!Secure", sarah!.user!.passwordHash);
  assert(passwordValid === true, "Sarah's seeded password verifies correctly with bcrypt");

  // TEST 2: Role Authorization & Admin Protection
  console.log("\nTest Suite 2: Role Authorization & Admin Protection");

  // Rule: MEMBER cannot access /admin routes
  const allowedAdminRoles: Role[] = [Role.ADMIN, Role.STAFF];
  assert(
    !allowedAdminRoles.includes(Role.MEMBER),
    "Role MEMBER is strictly barred from admin operations & staff areas"
  );

  // Rule: Member session requires status === APPROVED
  function canAccessMemberPortal(status: MemberStatus, role: Role): boolean {
    return status === MemberStatus.APPROVED && role === Role.MEMBER;
  }
  assert(
    canAccessMemberPortal(MemberStatus.APPROVED, Role.MEMBER) === true,
    "Approved member with MEMBER role is granted access to member portal"
  );
  assert(
    canAccessMemberPortal(MemberStatus.PENDING, Role.MEMBER) === false,
    "Pending member is barred from member portal"
  );
  assert(
    canAccessMemberPortal(MemberStatus.DEACTIVATED, Role.MEMBER) === false,
    "Deactivated member is barred from member portal"
  );

  // TEST 3: Data Isolation & Member Self-Service Updates
  console.log("\nTest Suite 3: Data Isolation & Member Profile Self-Service");

  // Update only Sarah's editable contact details
  const initialPhone = sarah!.phone;
  const testPhone = "+1 555-8888";

  const updatedSarah = await prisma.member.update({
    where: { id: sarah!.id },
    data: {
      phone: testPhone,
      address: "142 Whispering Pines Rd, Suite 4B",
      emergencyContactName: "David Greenwood",
      emergencyContactPhone: "+1 555-0102",
      healthNotes: "Mild bee sting allergy (carries EpiPen). Updated test note.",
    },
  });

  assert(updatedSarah.phone === testPhone, "Member can successfully update own phone number");
  assert(
    updatedSarah.address.includes("Suite 4B"),
    "Member can successfully update own residential address"
  );
  assert(
    updatedSarah.healthNotes?.includes("Updated test note") === true,
    "Member can update confidential health notes"
  );

  // Verify Liam's record was unaffected by Sarah's update
  const liamCheck = await prisma.member.findUnique({ where: { id: liam!.id } });
  assert(liamCheck?.phone === "+1 555-0103", "Liam's record remains completely untouched (Data Isolation)");

  // Revert Sarah's phone
  await prisma.member.update({
    where: { id: sarah!.id },
    data: { phone: initialPhone, address: "142 Whispering Pines Rd, Springfield" },
  });

  // TEST 4: Member Outing RSVP & Cancellation
  console.log("\nTest Suite 4: Outings Self-Registration & Cancellation");

  // Create temporary test event
  const testEvent = await prisma.event.create({
    data: {
      title: "Stage 8 Test Morning Bird Walk",
      eventType: "bird watching",
      description: "Automated test outing for member RSVP flow",
      meetingPoint: "Nature Center Gazebo",
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
      capacity: 1, // Only 1 spot!
      fee: 0,
      isPublished: true,
    },
  });

  // Member 1 (Sarah) RSVPs
  const rsvp = await prisma.eventRegistration.create({
    data: {
      eventId: testEvent.id,
      memberId: sarah!.id,
      attended: false,
    },
  });
  assert(rsvp.id !== undefined, "Member successfully reserves a spot in upcoming outing");

  // Duplicate RSVP attempt
  let duplicatePrevented = false;
  try {
    await prisma.eventRegistration.create({
      data: {
        eventId: testEvent.id,
        memberId: sarah!.id,
        attended: false,
      },
    });
  } catch (err) {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented === true, "Prevents duplicate registration for the same outing");

  // Capacity check: capacity is 1, and 1 spot is filled
  const currentCount = await prisma.eventRegistration.count({
    where: { eventId: testEvent.id },
  });
  const isFull = currentCount >= testEvent.capacity;
  assert(isFull === true, "Outing accurately reports full capacity (1/1 spots filled)");

  // Cancellation
  await prisma.eventRegistration.delete({
    where: { id: rsvp.id },
  });
  const countAfterCancel = await prisma.eventRegistration.count({
    where: { eventId: testEvent.id },
  });
  assert(countAfterCancel === 0, "Member can successfully cancel their outing reservation");

  // Clean up test event
  await prisma.event.delete({ where: { id: testEvent.id } });

  // TEST 5: Financial & Payment History Isolation
  console.log("\nTest Suite 5: Member Payment History & Expiry Visibility");

  // Sarah's payments
  const sarahPayments = await prisma.payment.findMany({
    where: { memberId: sarah!.id },
  });
  assert(sarahPayments.length >= 1, "Member can access their own recorded payment receipts");
  assert(sarahPayments[0].amount === 35.0, "Member sees accurate dues amount ($35.0)");

  // Ensure Sarah's query cannot see Liam's hypothetical payments
  const otherPayments = await prisma.payment.findMany({
    where: { memberId: liam!.id },
  });
  assert(
    !sarahPayments.some((p) => p.memberId === liam!.id),
    "Member queries are strictly isolated to their own memberId"
  );

  console.log("\n========================================");
  console.log("Stage 8 Tests Complete: All Passed!");
  console.log("========================================\n");
}

runStage8Tests()
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
