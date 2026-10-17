import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";
import { MemberStatus } from "@prisma/client";
import { sendApplicationApprovedEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. Enforce server-side authentication and role permissions
    await requireStaffOrAdmin();

    const { id } = await params;
    const body = await req.json();

    // Verify member exists
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const updateData: any = {};

    // Quick status update
    if (body.status && Object.values(MemberStatus).includes(body.status)) {
      updateData.status = body.status;
    }

    if (body.adminNotes !== undefined) {
      updateData.adminNotes = body.adminNotes;
    }

    // Full profile field updates
    if (body.fullName) updateData.fullName = body.fullName.trim();
    if (body.email) updateData.email = body.email.trim().toLowerCase();
    if (body.phone) updateData.phone = body.phone.trim();
    if (body.address) updateData.address = body.address.trim();
    if (body.occupation) updateData.occupation = body.occupation.trim();
    if (body.membershipTypeId) updateData.membershipTypeId = body.membershipTypeId;
    if (body.interestAreas) {
      updateData.interestAreas = Array.isArray(body.interestAreas)
        ? body.interestAreas.join(",")
        : body.interestAreas;
    }
    if (body.emergencyContactName) updateData.emergencyContactName = body.emergencyContactName.trim();
    if (body.emergencyContactPhone) updateData.emergencyContactPhone = body.emergencyContactPhone.trim();
    if (body.healthNotes !== undefined) updateData.healthNotes = body.healthNotes;

    const updated = await prisma.member.update({
      where: { id },
      data: updateData,
    });

    // Send approval email notification if status just transitioned to APPROVED
    if (body.status === MemberStatus.APPROVED && existing.status !== MemberStatus.APPROVED) {
      try {
        await sendApplicationApprovedEmail({
          to: updated.email,
          fullName: updated.fullName,
          memberCode: updated.memberCode,
        });
      } catch (err) {
        console.warn("Non-fatal: Failed to send approval email:", err);
      }
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    console.error("Admin member update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update member." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Only ADMIN role can permanently delete members
    const { requireAdmin } = await import("@/lib/auth-utils");
    await requireAdmin();

    const { id } = await params;

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    await prisma.member.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Member record permanently deleted." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized: Only administrators can delete members." },
      { status: 403 }
    );
  }
}
