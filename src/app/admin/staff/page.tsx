import prisma from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/auth-utils";
import { ShieldCheck } from "lucide-react";
import StaffManager from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffManagementPage() {
  // Server-side strict authorization: only ADMIN can access this page
  const currentUser = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      member: {
        select: {
          memberCode: true,
          fullName: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Staff & Team Access Management
          </h1>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Create coordinator accounts, assign roles, and control administrative permissions.
        </p>
      </div>

      <StaffManager initialUsers={users} currentUserId={currentUser.id!} />
    </div>
  );
}
