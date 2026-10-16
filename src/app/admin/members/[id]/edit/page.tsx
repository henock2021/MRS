import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCheck } from "lucide-react";
import EditMemberForm from "./EditMemberForm";

interface EditMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params;

  const [member, membershipTypes] = await Promise.all([
    prisma.member.findUnique({
      where: { id },
      include: { membershipType: true },
    }),
    prisma.membershipType.findMany({
      where: { isActive: true },
      orderBy: { fee: "asc" },
    }),
  ]);

  if (!member) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/admin/members/${member.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel & Back to Member Profile</span>
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="font-mono text-xs font-bold text-emerald-800">
              {member.memberCode}
            </span>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Edit Member Profile
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <EditMemberForm member={member} membershipTypes={membershipTypes} />
      </div>
    </div>
  );
}
