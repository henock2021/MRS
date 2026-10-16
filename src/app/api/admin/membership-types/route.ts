import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const membershipTypeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  fee: z.number().min(0, "Fee must be 0 or greater"),
  durationDays: z.number().int().min(1, "Duration must be at least 1 day"),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireStaffOrAdmin();

    const types = await prisma.membershipType.findMany({
      orderBy: { fee: "asc" },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({ success: true, membershipTypes: types });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireStaffOrAdmin();

    const body = await req.json();
    const parsed = membershipTypeSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, fee, durationDays, description, isActive } = parsed.data;

    // Check unique name
    const existing = await prisma.membershipType.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A membership type named '${name}' already exists.` },
        { status: 409 }
      );
    }

    const newType = await prisma.membershipType.create({
      data: {
        name,
        fee,
        durationDays,
        description: description || null,
        isActive,
      },
    });

    return NextResponse.json({ success: true, membershipType: newType }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create tier." }, { status: 500 });
  }
}
