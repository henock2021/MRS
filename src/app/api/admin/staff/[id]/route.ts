import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/auth-utils";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    if (!body.role || ![Role.ADMIN, Role.STAFF].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update role." },
      { status: 403 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireAdmin();
    const { id } = await params;

    // Prevent deleting your own account
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own logged-in admin account." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "User account deleted." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete user account." },
      { status: 403 }
    );
  }
}
