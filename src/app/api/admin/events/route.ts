import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";
import { z } from "zod";

export const EVENT_TYPES = [
  "hike",
  "tree planting",
  "clean-up",
  "bird watching",
  "camping",
  "workshop",
] as const;

const eventSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  eventType: z.string().trim().min(2, "Event type is required"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  meetingPoint: z.string().trim().min(3, "Meeting point is required"),
  dateTime: z.string().min(1, "Date and time is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1 person"),
  fee: z.number().min(0, "Fee must be 0 or greater").default(0),
  isPublished: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await requireStaffOrAdmin();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = {};
    if (type) {
      where.eventType = type;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { dateTime: "asc" },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireStaffOrAdmin();

    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid event input" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        eventType: data.eventType,
        description: data.description,
        meetingPoint: data.meetingPoint,
        dateTime: new Date(data.dateTime),
        capacity: data.capacity,
        fee: data.fee,
        isPublished: data.isPublished,
      },
    });

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event." },
      { status: 500 }
    );
  }
}
