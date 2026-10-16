import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // 1. Find token in SQLite
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    // 2. Enforce 1-hour expiration window
    if (new Date() > resetRecord.expiresAt) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetRecord.id },
      });

      return NextResponse.json(
        {
          error:
            "This password reset link has expired (links are valid for 1 hour). Please request a new one.",
        },
        { status: 400 }
      );
    }

    // 3. Hash new password securely with bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // 5. Delete used token (single-use guarantee)
    await prisma.passwordResetToken.delete({
      where: { id: resetRecord.id },
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset! You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
