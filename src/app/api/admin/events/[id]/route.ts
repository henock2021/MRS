import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin, requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const updateEventSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  eventType: z.string().trim().min(2).optional(),
  description: z.string().trim().min(5).optional(),
  meetingPoint: z.string().trim().min(3).optional(),
  dateTime: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
  fee: z.number().min(0).optional(),
  isPublished: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin();
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            member: {
              select: {
                id: true,
                memberCode: true,
                fullName: true,
                email: true,
                phone: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
                healthNotes: true,
              },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const data: any = { ...parsed.data };
    if (data.dateTime) {
      data.dateTime = new Date(data.dateTime);
    }

    const updated = await prisma.event.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update event." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Only ADMIN role can permanently delete events
    await requireAdmin();
    const { id } = await params;

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Event deleted successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete event." },
      { status: 403 }
    );
  }
}
