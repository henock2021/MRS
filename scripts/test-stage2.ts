import { registrationSchema, calculateAge } from "../src/lib/validations";
import { generateMemberCode } from "../src/lib/id-generator";
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
  console.log("🌲 Running Stage 2 Unit & Integration Tests...\n");

  // TEST 1: Age calculation
  console.log("Test Suite 1: Age Calculation");
  const today = new Date();
  const adultDob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()).toISOString();
  const minorDob = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()).toISOString();

  assert(calculateAge(adultDob) === 25, "Adult age calculated correctly (25)");
  assert(calculateAge(minorDob) === 15, "Minor age calculated correctly (15)");

  // TEST 2: Adult Registration Validation
  console.log("\nTest Suite 2: Adult Registration Validation");
  const validAdultData = {
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 555-4567",
    address: "742 Evergreen Terrace",
    dateOfBirth: adultDob,
    gender: "female",
    occupation: "Botanist",
    membershipTypeId: "sample-tier-id",
    interestAreas: ["hiking", "bird watching"],
    emergencyContactName: "Carlos Rivera",
    emergencyContactPhone: "+1 555-9876",
    healthNotes: "None",
    agreedToRules: true,
    liabilityWaiver: true,
  };

  const adultResult = registrationSchema.safeParse(validAdultData);
  assert(adultResult.success, "Valid adult registration passes validation");

  // TEST 3: Under-18 Guardian Consent Rule
  console.log("\nTest Suite 3: Under-18 Guardian Consent Rule");
  const minorWithoutGuardian = {
    ...validAdultData,
    dateOfBirth: minorDob,
    guardianName: "",
    guardianPhone: "",
    guardianConsent: false,
  };

  const minorFailResult = registrationSchema.safeParse(minorWithoutGuardian);
  assert(!minorFailResult.success, "Minor without guardian details fails validation");
  if (!minorFailResult.success) {
    const issuePaths = minorFailResult.error.issues.map((i) => i.path.join("."));
    assert(issuePaths.includes("guardianName"), "Catches missing guardianName");
    assert(issuePaths.includes("guardianPhone"), "Catches missing guardianPhone");
    assert(issuePaths.includes("guardianConsent"), "Catches missing guardianConsent");
  }

  const minorWithGuardian = {
    ...validAdultData,
    dateOfBirth: minorDob,
    guardianName: "Elena Rivera (Mother)",
    guardianPhone: "+1 555-8888",
    guardianConsent: true,
  };

  const minorPassResult = registrationSchema.safeParse(minorWithGuardian);
  assert(minorPassResult.success, "Minor WITH guardian name, phone, and consent passes validation");

  // TEST 4: Missing Rules Agreement or Waiver
  console.log("\nTest Suite 4: Mandatory Agreements");
  const missingRulesResult = registrationSchema.safeParse({
    ...validAdultData,
    agreedToRules: false,
  });
  assert(!missingRulesResult.success, "Fails if applicant does not agree to rules");

  const missingWaiverResult = registrationSchema.safeParse({
    ...validAdultData,
    liabilityWaiver: false,
  });
  assert(!missingWaiverResult.success, "Fails if applicant does not agree to liability waiver");

  // TEST 5: Sequential Member ID Generation
  console.log("\nTest Suite 5: Sequential Member ID Generation");
  const nextCode = await generateMemberCode();
  assert(nextCode.startsWith("NC-"), `Member code starts with NC- prefix (${nextCode})`);
  assert(nextCode === "NC-000103", `Next member code is sequential NC-000103 (${nextCode})`);

  // TEST 6: Duplicate Email and Phone Detection
  console.log("\nTest Suite 6: Duplicate Email and Phone Detection");
  // Check against seeded member: sarah.greenwood@example.com / +1 555-0101
  const duplicateEmail = await prisma.member.findUnique({
    where: { email: "sarah.greenwood@example.com" },
  });
  assert(duplicateEmail !== null, "Correctly identifies existing email as duplicate in database");

  const duplicatePhone = await prisma.member.findUnique({
    where: { phone: "+1 555-0101" },
  });
  assert(duplicatePhone !== null, "Correctly identifies existing phone as duplicate in database");

  const newUniqueEmail = await prisma.member.findUnique({
    where: { email: "completely.brandnew@example.com" },
  });
  assert(newUniqueEmail === null, "Accepts brand new unique email address");

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
