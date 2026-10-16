import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '""';
  const stringValue = String(field);
  // Double quotes inside string are escaped with another double quote
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
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
            member: true,
          },
          orderBy: { registeredAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // CSV Headers
    const headers = [
      "Member ID",
      "Full Name",
      "Phone",
      "Email",
      "Emergency Contact Name",
      "Emergency Contact Phone",
      "Allergies & Health Notes",
      "Attendance Status",
      "Registration Date",
    ];

    const rows = event.registrations.map((reg) => [
      escapeCsvField(reg.member.memberCode),
      escapeCsvField(reg.member.fullName),
      escapeCsvField(reg.member.phone),
      escapeCsvField(reg.member.email),
      escapeCsvField(reg.member.emergencyContactName),
      escapeCsvField(reg.member.emergencyContactPhone),
      escapeCsvField(reg.member.healthNotes || "None"),
      escapeCsvField(reg.attended ? "Attended" : "Not Attended"),
      escapeCsvField(new Date(reg.registeredAt).toISOString().split("T")[0]),
    ]);

    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const safeTitle = event.title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const filename = `trip-safety-roster-${safeTitle}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export participant roster." }, { status: 500 });
  }
}
