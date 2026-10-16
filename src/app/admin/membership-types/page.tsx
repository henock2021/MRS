import prisma from "@/lib/prisma";
import { Layers } from "lucide-react";
import MembershipTypeManager from "@/components/admin/MembershipTypeManager";

export const dynamic = "force-dynamic";

export default async function MembershipTypesPage() {
  const membershipTypes = await prisma.membershipType.findMany({
    orderBy: { fee: "asc" },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Membership Tiers
          </h1>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Define membership categories, annual fees, validity duration, and tier perks.
        </p>
      </div>

      <MembershipTypeManager initialTypes={membershipTypes} />
    </div>
  );
}
