import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registrationSchema, calculateAge } from "@/lib/validations";
import { generateMemberCode } from "@/lib/id-generator";
import { MemberStatus } from "@prisma/client";

/**
 * GET /api/register
 * Returns active membership tiers so the registration form
 * can render the fees, names, and descriptions dynamically.
 */
export async function GET() {
  try {
    const membershipTypes = await prisma.membershipType.findMany({
      where: { isActive: true },
      orderBy: { fee: "asc" },
      select: {
        id: true,
        name: true,
        fee: true,
        durationDays: true,
        description: true,
      },
    });

    return NextResponse.json({ success: true, membershipTypes });
  } catch (error) {
    console.error("Error fetching membership types:", error);
    return NextResponse.json(
      { error: "Unable to load membership tiers. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/register
 * Handles public member application submissions.
 * Validates with Zod, enforces under-18 guardian consent,
 * checks for duplicate email or phone, generates sequential NC-XXXXXX code,
 * and initializes application status as PENDING.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Server-side validation using Zod
    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || [];
      const firstError = issues[0]?.message || "Invalid registration form submission.";
      return NextResponse.json(
        {
          error: firstError,
          fieldErrors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 2. Prevent duplicate registrations by Email
    const existingEmail = await prisma.member.findUnique({
      where: { email: data.email },
      select: { id: true, memberCode: true, status: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          error: `An application with email '${data.email}' has already been submitted (Member ID: ${existingEmail.memberCode}). If you are already a member, please sign in.`,
        },
        { status: 409 }
      );
    }

    // 3. Prevent duplicate registrations by Phone number
    const existingPhone = await prisma.member.findUnique({
      where: { phone: data.phone },
      select: { id: true, memberCode: true },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          error: `The phone number '${data.phone}' is already registered with another membership application.`,
        },
        { status: 409 }
      );
    }

    // 4. Verify selected Membership Type exists
    const membershipType = await prisma.membershipType.findUnique({
      where: { id: data.membershipTypeId },
    });

    if (!membershipType || !membershipType.isActive) {
      return NextResponse.json(
        { error: "Selected membership tier is invalid or no longer active." },
        { status: 400 }
      );
    }

    // 5. Age check for Minor classification
    const age = calculateAge(data.dateOfBirth);
    const isMinor = age < 18;

    // 6. Generate sequential Member ID (NC-XXXXXX)
    const memberCode = await generateMemberCode();

    // 7. Store member record with PENDING status
    const newMember = await prisma.member.create({
      data: {
        memberCode,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender || null,
        occupation: data.occupation,
        photoUrl: data.photoUrl || null,
        isMinor,
        guardianName: isMinor ? data.guardianName : null,
        guardianPhone: isMinor ? data.guardianPhone : null,
        guardianConsent: isMinor ? Boolean(data.guardianConsent) : false,
        agreedToRules: true,
        liabilityWaiver: true,
        status: MemberStatus.PENDING,
        interestAreas: data.interestAreas.join(","),
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        healthNotes: data.healthNotes || null,
        membershipTypeId: data.membershipTypeId,
      },
      include: {
        membershipType: true,
      },
    });

    return NextResponse.json({
      success: true,
      memberCode: newMember.memberCode,
      fullName: newMember.fullName,
      email: newMember.email,
      membershipTypeName: newMember.membershipType?.name,
      membershipFee: newMember.membershipType?.fee,
    });
  } catch (error) {
    console.error("Public registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving your registration. Please try again." },
      { status: 500 }
    );
  }
}
