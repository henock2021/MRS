import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Zod schema for member self-service profile updates
const updateProfileSchema = z.object({
  phone: z.string().min(7, "Please enter a valid phone number (at least 7 characters)").trim(),
  address: z.string().min(5, "Please enter your full residential address").trim(),
  emergencyContactName: z.string().min(2, "Emergency contact name is required").trim(),
  emergencyContactPhone: z.string().min(7, "Emergency contact phone is required").trim(),
  healthNotes: z.string().optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    // 1. Authenticate user from session cookie
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch authenticated user's member record strictly by userId
    const member = await prisma.member.findFirst({
      where: { userId: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member record not found" }, { status: 404 });
    }

    // 3. Validate request payload
    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { phone, address, emergencyContactName, emergencyContactPhone, healthNotes } =
      result.data;

    // 4. Duplicate phone validation against other members
    if (phone !== member.phone) {
      const existingPhone = await prisma.member.findFirst({
        where: {
          phone,
          id: { not: member.id },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "This phone number is already registered to another club member." },
          { status: 409 }
        );
      }
    }

    // 5. Update only the caller's own member record
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        phone,
        address,
        emergencyContactName,
        emergencyContactPhone,
        healthNotes: healthNotes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your profile information has been saved successfully.",
      member: updatedMember,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving your profile." },
      { status: 500 }
    );
  }
}
