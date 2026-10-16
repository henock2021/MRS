import { PrismaClient, Role, MemberStatus, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Nature Club database seeding...\n");

  // 1. Create or update Default Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@natureclub.org";
  const adminPassword = process.env.ADMIN_PASSWORD || "NatureAdmin2026!Secure";
  const adminName = process.env.ADMIN_NAME || "Chief Club Warden";

  // Hash password using bcrypt with 12 salt rounds
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Admin account created:`);
  console.log(`   - Email:    ${admin.email}`);
  console.log(`   - Name:     ${admin.name}`);
  console.log(`   - Role:     ${admin.role}`);
  console.log(`   - Password: (configured via .env)\n`);

  // 1b. Create or update Default Staff (Volunteer Coordinator)
  const staffEmail = "staff@natureclub.org";
  const staffPassword = "NatureStaff2026!Secure";
  const staffName = "Volunteer Coordinator";
  const staffHash = await bcrypt.hash(staffPassword, 12);

  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {
      name: staffName,
      passwordHash: staffHash,
      role: Role.STAFF,
    },
    create: {
      email: staffEmail,
      name: staffName,
      passwordHash: staffHash,
      role: Role.STAFF,
    },
  });

  console.log(`✅ Staff account created:`);
  console.log(`   - Email:    ${staff.email}`);
  console.log(`   - Name:     ${staff.name}`);
  console.log(`   - Role:     ${staff.role}`);
  console.log(`   - Password: NatureStaff2026!Secure\n`);

  // 2. Create standard Membership Types
  const membershipTypesData = [
    {
      name: "Student",
      fee: 15.0,
      durationDays: 365,
      description: "Discounted access for students and youth with valid school identification.",
    },
    {
      name: "Adult",
      fee: 35.0,
      durationDays: 365,
      description: "Standard individual membership for adult nature lovers (18+).",
    },
    {
      name: "Family",
      fee: 60.0,
      durationDays: 365,
      description: "Covers up to two adults and dependent children living in the same household.",
    },
    {
      name: "Supporter",
      fee: 100.0,
      durationDays: 365,
      description: "Contribute extra funds to directly support tree planting & trail maintenance.",
    },
  ];

  const createdTypes: Record<string, string> = {};
  for (const mt of membershipTypesData) {
    const record = await prisma.membershipType.upsert({
      where: { name: mt.name },
      update: {
        fee: mt.fee,
        durationDays: mt.durationDays,
        description: mt.description,
        isActive: true,
      },
      create: mt,
    });
    createdTypes[record.name] = record.id;
  }
  console.log(`✅ Seeded ${membershipTypesData.length} Membership Types:`);
  membershipTypesData.forEach((t) => console.log(`   - ${t.name}: $${t.fee} / ${t.durationDays} days`));
  console.log("");

  // 3. Create Sample Events
  const now = new Date();
  const sampleEvents = [
    {
      title: "Pine Ridge Forest Hike",
      eventType: "hike",
      description: "An invigorating 8km trail hike through old-growth pine forest. Moderate difficulty with scenic ridge views.",
      meetingPoint: "North Gate Trailhead Parking Lot",
      dateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      capacity: 25,
      fee: 0.0,
      isPublished: true,
    },
    {
      title: "Community Riverbank Clean-up",
      eventType: "clean-up",
      description: "Join fellow nature stewards to remove plastics and litter along the riverbanks. Gloves and bags provided.",
      meetingPoint: "Willows Bend Riverside Park Pavilion",
      dateTime: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      capacity: 40,
      fee: 0.0,
      isPublished: true,
    },
    {
      title: "Spring Songbird Watching Walk",
      eventType: "bird watching",
      description: "Early morning guided walk to observe migrating songbirds and waterfowl. Bring binoculars if you have them!",
      meetingPoint: "Audubon Meadow Visitor Center",
      dateTime: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
      capacity: 15,
      fee: 5.0,
      isPublished: true,
    },
    {
      title: "Family Overnight Wilderness Camp",
      eventType: "camping",
      description: "A fun weekend camping trip with campfire stories, stargazing, and outdoor ethics workshop for families.",
      meetingPoint: "Cedar Grove Campsite 3",
      dateTime: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      capacity: 20,
      fee: 20.0,
      isPublished: true,
    },
  ];

  for (const ev of sampleEvents) {
    const existing = await prisma.event.findFirst({ where: { title: ev.title } });
    if (!existing) {
      await prisma.event.create({ data: ev });
    }
  }
  console.log(`✅ Seeded ${sampleEvents.length} upcoming sample club events.\n`);

  // 4. Create sample member accounts to preview system
  // Sample Member 1: Approved Adult with User login account
  const sarahPasswordHash = await bcrypt.hash("MemberPass2026!Secure", 12);
  const sarahUser = await prisma.user.upsert({
    where: { email: "sarah.greenwood@example.com" },
    update: {
      passwordHash: sarahPasswordHash,
      role: Role.MEMBER,
      name: "Sarah Greenwood",
    },
    create: {
      email: "sarah.greenwood@example.com",
      passwordHash: sarahPasswordHash,
      role: Role.MEMBER,
      name: "Sarah Greenwood",
    },
  });

  const sampleMember1 = await prisma.member.upsert({
    where: { email: "sarah.greenwood@example.com" },
    update: {
      userId: sarahUser.id,
      status: MemberStatus.APPROVED,
    },
    create: {
      memberCode: "NC-000101",
      fullName: "Sarah Greenwood",
      phone: "+1 555-0101",
      email: "sarah.greenwood@example.com",
      address: "142 Whispering Pines Rd, Springfield",
      dateOfBirth: new Date("1992-05-14"),
      gender: "female",
      occupation: "Landscape Architect",
      isMinor: false,
      agreedToRules: true,
      liabilityWaiver: true,
      status: MemberStatus.APPROVED,
      interestAreas: "hiking,tree planting,photography",
      emergencyContactName: "David Greenwood (Spouse)",
      emergencyContactPhone: "+1 555-0102",
      healthNotes: "Mild bee sting allergy (carries EpiPen)",
      membershipTypeId: createdTypes["Adult"],
      userId: sarahUser.id,
    },
  });

  // Seed sample payment for Sarah (valid for 365 days)
  const existingPayment1 = await prisma.payment.findFirst({
    where: { memberId: sampleMember1.id },
  });
  if (!existingPayment1) {
    await prisma.payment.create({
      data: {
        memberId: sampleMember1.id,
        amount: 35.0,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        startDate: new Date(),
        expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        note: "Annual Adult Membership Fee 2026",
        recordedBy: admin.name || "Admin",
      },
    });
  }

  // Seed sample past attended event and upcoming registered event for Sarah
  const pastEvent = await prisma.event.upsert({
    where: { id: "past-seed-event-1" },
    update: {},
    create: {
      id: "past-seed-event-1",
      title: "Autumn Canopy Trail Walk",
      eventType: "hike",
      description: "Scenic autumn foliage walk exploring deciduous tree species and native fungi.",
      meetingPoint: "South Ridge Information Kiosk",
      dateTime: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      capacity: 20,
      fee: 0.0,
      isPublished: true,
    },
  });

  const existingPastReg = await prisma.eventRegistration.findFirst({
    where: { eventId: pastEvent.id, memberId: sampleMember1.id },
  });
  if (!existingPastReg) {
    await prisma.eventRegistration.create({
      data: {
        eventId: pastEvent.id,
        memberId: sampleMember1.id,
        attended: true,
      },
    });
  }

  const upcomingEvent = await prisma.event.findFirst({
    where: { title: "Pine Ridge Forest Hike" },
  });
  if (upcomingEvent) {
    const existingUpcomingReg = await prisma.eventRegistration.findFirst({
      where: { eventId: upcomingEvent.id, memberId: sampleMember1.id },
    });
    if (!existingUpcomingReg) {
      await prisma.eventRegistration.create({
        data: {
          eventId: upcomingEvent.id,
          memberId: sampleMember1.id,
          attended: false,
        },
      });
    }
  }

  // Sample Member 2: Pending Student
  await prisma.member.upsert({
    where: { email: "liam.chen@example.com" },
    update: {},
    create: {
      memberCode: "NC-000102",
      fullName: "Liam Chen",
      phone: "+1 555-0103",
      email: "liam.chen@example.com",
      address: "88 Valley Heights Way, Springfield",
      dateOfBirth: new Date("2008-09-20"), // 17 years old (minor)
      gender: "male",
      occupation: "High School Student",
      isMinor: true,
      guardianName: "Mei-Ling Chen (Mother)",
      guardianPhone: "+1 555-0104",
      guardianConsent: true,
      agreedToRules: true,
      liabilityWaiver: true,
      status: MemberStatus.PENDING,
      interestAreas: "bird watching,education,clean-up",
      emergencyContactName: "Mei-Ling Chen",
      emergencyContactPhone: "+1 555-0104",
      healthNotes: "None",
      membershipTypeId: createdTypes["Student"],
    },
  });

  console.log("✅ Seeded sample members:");
  console.log("   - Sarah Greenwood (NC-000101) - Status: APPROVED, Adult");
  console.log("   - Liam Chen       (NC-000102) - Status: PENDING, Student (Minor with guardian consent)");

  console.log("\n🎉 Database seeding completed successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
