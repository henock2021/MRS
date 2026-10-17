import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";
import { PaymentMethod, MemberStatus } from "@prisma/client";
import { z } from "zod";
import { sendPaymentReceiptEmail } from "@/lib/email";

const paymentSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  note: z.string().max(250).optional().nullable(),
  autoApproveMember: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireStaffOrAdmin();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const memberId = searchParams.get("memberId");

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const where: any = {};

    if (memberId) {
      where.memberId = memberId;
    }

    if (filter === "expiring_soon") {
      // Expiry date is between now and +30 days
      where.expiryDate = {
        gte: now,
        lte: thirtyDaysFromNow,
      };
    } else if (filter === "expired") {
      // Expiry date is in the past
      where.expiryDate = {
        lt: now,
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        member: {
          select: {
            id: true,
            memberCode: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            membershipType: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireStaffOrAdmin();

    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid payment data" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    // Record the payment
    const payment = await prisma.payment.create({
      data: {
        memberId: data.memberId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        startDate: new Date(data.startDate),
        expiryDate: new Date(data.expiryDate),
        note: data.note || null,
        recordedBy: user.name || user.email || "Staff",
      },
    });

    // If member was PENDING and autoApprove was true (or by default when paying dues), activate status to APPROVED
    if (member.status === MemberStatus.PENDING || data.autoApproveMember) {
      await prisma.member.update({
        where: { id: member.id },
        data: { status: MemberStatus.APPROVED },
      });
    }

    // Send electronic payment receipt email (non-blocking)
    try {
      await sendPaymentReceiptEmail({
        to: member.email,
        fullName: member.fullName,
        memberCode: member.memberCode,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod.replace(/_/g, " "),
        validUntil: payment.expiryDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    } catch (emailErr) {
      console.warn("Non-fatal: Failed to send payment receipt email:", emailErr);
    }

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    console.error("Record payment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record payment." },
      { status: 500 }
    );
  }
}
