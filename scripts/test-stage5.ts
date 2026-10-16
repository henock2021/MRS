import prisma from "../src/lib/prisma";

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
  console.log("🌲 Running Stage 5 Unit & Integration Tests...\n");

  // TEST 1: Event Creation & Capacity Properties
  console.log("Test Suite 1: Event Creation & Attributes");
  const testEvent = await prisma.event.create({
    data: {
      title: "Alpine Ridge Stargazing Trek",
      eventType: "camping",
      description: "Night sky hike and telescope observation on the ridge.",
      meetingPoint: "Lookout Point Kiosk",
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      capacity: 2, // Low capacity to test limits
      fee: 15.0,
      isPublished: true,
    },
  });

  assert(testEvent.title === "Alpine Ridge Stargazing Trek", "Event created with correct title");
  assert(testEvent.eventType === "camping", "Event type recorded as camping");
  assert(testEvent.capacity === 2, "Capacity set to 2 participants");
  assert(testEvent.fee === 15.0, "Fee stored accurately ($15.0)");

  // TEST 2: Member Registration & Duplicate Prevention
  console.log("\nTest Suite 2: Member Registration & Duplicate Prevention");
  const sarah = await prisma.member.findUnique({
    where: { email: "sarah.greenwood@example.com" },
  });
  const liam = await prisma.member.findUnique({
    where: { email: "liam.chen@example.com" },
  });

  assert(sarah !== null, "Found test member Sarah");
  assert(liam !== null, "Found test member Liam");

  // Register Sarah
  const reg1 = await prisma.eventRegistration.create({
    data: {
      eventId: testEvent.id,
      memberId: sarah!.id,
    },
  });
  assert(reg1.id !== null, "Registered member 1 (Sarah) for event");

  // Attempt duplicate registration for Sarah
  let duplicateCaught = false;
  try {
    await prisma.eventRegistration.create({
      data: {
        eventId: testEvent.id,
        memberId: sarah!.id,
      },
    });
  } catch (err: any) {
    duplicateCaught = true;
  }
  assert(duplicateCaught === true, "Prevents duplicate registration of same member for same event");

  // Register Liam (filling capacity to 2/2)
  const reg2 = await prisma.eventRegistration.create({
    data: {
      eventId: testEvent.id,
      memberId: liam!.id,
    },
  });
  assert(reg2.id !== null, "Registered member 2 (Liam) for event");

  // Verify event capacity filled
  const count = await prisma.eventRegistration.count({
    where: { eventId: testEvent.id },
  });
  assert(count === testEvent.capacity, `Event is now at full capacity (${count}/${testEvent.capacity})`);

  // TEST 3: Attendance Tracking Toggle
  console.log("\nTest Suite 3: Attendance Tracking & Member Outings Count");
  assert(reg1.attended === false, "Registration starts with attended: false");

  // Mark Sarah as attended
  const updatedReg1 = await prisma.eventRegistration.update({
    where: { id: reg1.id },
    data: { attended: true },
  });
  assert(updatedReg1.attended === true, "Attendance marked as true for Sarah");

  // Verify member's attended outings count
  const sarahAttendedCount = await prisma.eventRegistration.count({
    where: { memberId: sarah!.id, attended: true },
  });
  assert(sarahAttendedCount >= 1, "Sarah's attended outings count reflects checked-in outing");

  // TEST 4: Trip Safety Roster & Emergency Contacts
  console.log("\nTest Suite 4: Trip Safety Roster Data Integrity");
  const roster = await prisma.eventRegistration.findMany({
    where: { eventId: testEvent.id },
    include: {
      member: {
        select: {
          memberCode: true,
          fullName: true,
          phone: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          healthNotes: true,
        },
      },
    },
  });

  assert(roster.length === 2, "Roster contains both registered participants");
  const sarahRosterEntry = roster.find((r) => r.member.memberCode === "NC-000101");
  assert(
    Boolean(sarahRosterEntry?.member.emergencyContactName),
    "Trip safety roster includes emergency contact name"
  );
  assert(
    Boolean(sarahRosterEntry?.member.emergencyContactPhone),
    "Trip safety roster includes emergency contact phone"
  );
  assert(
    Boolean(sarahRosterEntry?.member.healthNotes),
    "Trip safety roster includes health notes / allergies"
  );

  // Clean up test event (cascades to test registrations)
  await prisma.event.delete({ where: { id: testEvent.id } });
  console.log("  Cleaned up temporary test event and registrations.");

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
