import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin();
    const { id: eventId } = await params;

    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required." }, { status: 400 });
    }

    // 1. Fetch event and current registration count
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // 2. Check capacity limit
    if (event._count.registrations >= event.capacity) {
      return NextResponse.json(
        { error: `This outing has reached maximum capacity (${event.capacity} participants).` },
        { status: 400 }
      );
    }

    // 3. Verify member exists and is not already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_memberId: {
          eventId,
          memberId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "This member is already registered for this event." },
        { status: 409 }
      );
    }

    // 4. Register member
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
      },
      include: {
        member: {
          select: {
            id: true,
            memberCode: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch (error: any) {
    console.error("Event registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register member for event." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin();
    const { id: eventId } = await params;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    await prisma.eventRegistration.delete({
      where: {
        eventId_memberId: {
          eventId,
          memberId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Member removed from roster." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove member from event." },
      { status: 500 }
    );
  }
}
