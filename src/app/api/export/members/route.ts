import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { MemberStatus } from "@prisma/client";
import { calculateAge } from "@/lib/validations";

function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '""';
  const stringValue = String(field);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(req: NextRequest) {
  try {
    // Only ADMIN role can export full member rosters
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const tier = searchParams.get("tier")?.trim() || "";
    const interest = searchParams.get("interest")?.trim() || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { memberCode: { contains: search } },
      ];
    }

    if (status && Object.values(MemberStatus).includes(status as MemberStatus)) {
      where.status = status as MemberStatus;
    }

    if (tier) {
      where.membershipTypeId = tier;
    }

    if (interest) {
      where.interestAreas = { contains: interest };
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { memberCode: "asc" },
      include: {
        membershipType: true,
      },
    });

    const headers = [
      "Member ID",
      "Full Name",
      "Email Address",
      "Phone Number",
      "Residential Address",
      "Date of Birth",
      "Age",
      "Gender",
      "Occupation / School",
      "Membership Tier",
      "Annual Fee ($)",
      "Status",
      "Is Minor",
      "Guardian Name",
      "Guardian Phone",
      "Activity Interests",
      "Registration Date",
    ];

    const rows = members.map((m) => {
      const age = calculateAge(m.dateOfBirth);
      return [
        escapeCsvField(m.memberCode),
        escapeCsvField(m.fullName),
        escapeCsvField(m.email),
        escapeCsvField(m.phone),
        escapeCsvField(m.address),
        escapeCsvField(new Date(m.dateOfBirth).toISOString().split("T")[0]),
        escapeCsvField(age),
        escapeCsvField(m.gender || "Not specified"),
        escapeCsvField(m.occupation),
        escapeCsvField(m.membershipType?.name || "Standard"),
        escapeCsvField(m.membershipType?.fee || 0),
        escapeCsvField(m.status),
        escapeCsvField(m.isMinor ? "Yes" : "No"),
        escapeCsvField(m.guardianName || "N/A"),
        escapeCsvField(m.guardianPhone || "N/A"),
        escapeCsvField(m.interestAreas),
        escapeCsvField(new Date(m.createdAt).toISOString().split("T")[0]),
      ];
    });

    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const todayStr = new Date().toISOString().split("T")[0];
    const filename = `nature-club-members-${todayStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Member export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export members." },
      { status: 403 }
    );
  }
}
