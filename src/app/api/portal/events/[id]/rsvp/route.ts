import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { MemberStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // 1. Authenticate member from session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch authenticated user's member record strictly by userId
    const member = await prisma.member.findFirst({
      where: { userId: session.user.id },
    });

    if (!member || member.status !== MemberStatus.APPROVED) {
      return NextResponse.json(
        { error: "Only approved club members can RSVP for events." },
        { status: 403 }
      );
    }

    // 3. Find event with current registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: true,
      },
    });

    if (!event || !event.isPublished) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (new Date(event.dateTime) < new Date()) {
      return NextResponse.json(
        { error: "Cannot register or cancel for past events." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const action = body.action; // "register" | "cancel"

    if (action === "register") {
      // Check if already registered
      const existing = event.registrations.find((r) => r.memberId === member.id);
      if (existing) {
        return NextResponse.json(
          { error: "You are already registered for this outing." },
          { status: 400 }
        );
      }

      // Check capacity
      if (event.registrations.length >= event.capacity) {
        return NextResponse.json(
          { error: "This outing is currently at maximum capacity." },
          { status: 400 }
        );
      }

      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          memberId: member.id,
          attended: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `You are now registered for "${event.title}"! See you at the meeting point.`,
      });
    } else if (action === "cancel") {
      const existing = event.registrations.find((r) => r.memberId === member.id);
      if (!existing) {
        return NextResponse.json(
          { error: "You are not registered for this event." },
          { status: 400 }
        );
      }

      await prisma.eventRegistration.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        success: true,
        message: `Your registration for "${event.title}" has been cancelled.`,
      });
    }

    return NextResponse.json({ error: "Invalid action. Must be register or cancel." }, { status: 400 });
  } catch (error) {
    console.error("Member RSVP error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating your reservation." },
      { status: 500 }
    );
  }
}
