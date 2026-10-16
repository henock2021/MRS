import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role, MemberStatus } from "@prisma/client";

// Input validation schema for member account activation and password setup
const activateSchema = z
  .object({
    email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
    memberCode: z
      .string()
      .min(3, "Member ID is required")
      .transform((val) => val.trim().toUpperCase()),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = activateSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, memberCode, password } = result.data;

    // 1. Find member by email
    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member || member.memberCode.toUpperCase() !== memberCode) {
      return NextResponse.json(
        {
          error:
            "No matching member record found with this Email and Member ID. Please check your registration confirmation slip.",
        },
        { status: 404 }
      );
    }

    // 2. Enforce lifecycle approval status
    if (member.status === MemberStatus.PENDING) {
      return NextResponse.json(
        {
          error:
            "Your membership registration is currently PENDING review by club coordinators. You can set your password once your application is approved.",
        },
        { status: 400 }
      );
    }

    if (member.status === MemberStatus.REJECTED) {
      return NextResponse.json(
        {
          error:
            "This membership application was not approved. Please reach out to club coordinators for guidance.",
        },
        { status: 400 }
      );
    }

    if (member.status === MemberStatus.DEACTIVATED) {
      return NextResponse.json(
        {
          error:
            "This membership account is currently deactivated. Please contact club administration to re-activate.",
        },
        { status: 400 }
      );
    }

    // 3. Hash secure password using bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create or update User account and link to Member profile
    const existingUser = await prisma.user.findUnique({
      where: { email: member.email },
    });

    let userId: string;

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          name: member.fullName,
        },
      });
      userId = updatedUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          email: member.email,
          name: member.fullName,
          passwordHash,
          role: Role.MEMBER,
        },
      });
      userId = newUser.id;
    }

    // Ensure member record has 1-to-1 link to user account
    if (member.userId !== userId) {
      await prisma.member.update({
        where: { id: member.id },
        data: { userId },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Your password has been successfully set! You can now log into the Nature Club Member Portal.",
    });
  } catch (error) {
    console.error("Member activation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while setting up your password. Please try again." },
      { status: 500 }
    );
  }
}
