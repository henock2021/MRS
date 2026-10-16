import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const updateTierSchema = z.object({
  name: z.string().trim().min(2).optional(),
  fee: z.number().min(0).optional(),
  durationDays: z.number().int().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.membershipType.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, membershipType: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update membership tier." },
      { status: 500 }
    );
  }
}
