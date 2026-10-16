import { requireMemberSession } from "@/lib/auth-utils";
import EditProfileForm from "@/components/portal/EditProfileForm";
import { User, ShieldCheck } from "lucide-react";

export default async function MemberProfilePage() {
  // Strictly authenticates caller and fetches ONLY their own member record by session userId
  const { member } = await requireMemberSession();

  const formattedMember = {
    id: member.id,
    memberCode: member.memberCode,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    address: member.address,
    dateOfBirth: member.dateOfBirth,
    gender: member.gender,
    occupation: member.occupation,
    emergencyContactName: member.emergencyContactName,
    emergencyContactPhone: member.emergencyContactPhone,
    healthNotes: member.healthNotes,
    membershipTypeName: member.membershipType?.name,
    status: member.status,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <User className="w-4 h-4" />
          <span>Member Self-Service</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          My Member Profile
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Manage your contact information, emergency contacts, and medical preferences
        </p>
      </div>

      <EditProfileForm member={formattedMember} />
    </div>
  );
}
