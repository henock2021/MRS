import prisma from "@/lib/prisma";

/**
 * Generates the next sequential Nature Club Member ID.
 * Format: NC-000101, NC-000102, NC-000103...
 *
 * Looks up the most recently created member in SQLite and increments
 * the numeric part. Falls back to NC-000101 if no members exist yet.
 */
export async function generateMemberCode(): Promise<string> {
  const lastMember = await prisma.member.findFirst({
    orderBy: { createdAt: "desc" },
    select: { memberCode: true },
  });

  let nextNumber = 101; // Starting number for the club
  if (lastMember?.memberCode) {
    const match = lastMember.memberCode.match(/NC-(\d+)/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }
  }

  return `NC-${String(nextNumber).padStart(6, "0")}`;
}
