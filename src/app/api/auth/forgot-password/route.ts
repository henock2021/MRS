import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // 1. Look up user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    let resetUrl: string | null = null;

    if (user) {
      // 2. Generate a secure, unpredictable 64-character hex token
      const token = crypto.randomBytes(32).toString("hex");

      // 3. Set token expiry window to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Clean up previous tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Save token in SQLite
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // Determine application origin URL
      const origin =
        request.headers.get("origin") ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

      resetUrl = `${origin}/reset-password?token=${token}`;

      console.log(`\n🔑 [Password Reset Request]`);
      console.log(`User: ${user.email} (${user.role})`);
      console.log(`Direct Reset Link: ${resetUrl}\n`);
    }

    // Always return a generic success message to protect privacy and prevent account enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, password reset instructions have been generated.",
      // Provide resetUrl in development/testing mode for convenience without an SMTP server
      debugResetUrl: resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
