import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin();
    const { id: eventId } = await params;

    const body = await req.json();
    const { memberId, attended, notes } = body;

    if (!memberId || attended === undefined) {
      return NextResponse.json(
        { error: "memberId and attended status are required." },
        { status: 400 }
      );
    }

    const updated = await prisma.eventRegistration.update({
      where: {
        eventId_memberId: {
          eventId,
          memberId,
        },
      },
      data: {
        attended: Boolean(attended),
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json({ success: true, registration: updated });
  } catch (error: any) {
    console.error("Attendance update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update attendance." },
      { status: 500 }
    );
  }
}
