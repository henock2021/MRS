import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ShieldAlert,
  HeartHandshake,
  CreditCard,
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Edit,
  Trees,
} from "lucide-react";
import { calculateAge } from "@/lib/validations";
import MemberActionButtons from "@/components/admin/MemberActionButtons";
import RecordPaymentModal from "@/components/admin/RecordPaymentModal";

import { requireStaffOrAdmin } from "@/lib/auth-utils";

interface MemberDetailsPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  PENDING: { bg: "bg-amber-100 border-amber-200 text-amber-900", text: "Pending Review", icon: Clock },
  APPROVED: { bg: "bg-emerald-100 border-emerald-200 text-emerald-900", text: "Approved", icon: CheckCircle2 },
  REJECTED: { bg: "bg-rose-100 border-rose-200 text-rose-900", text: "Rejected", icon: XCircle },
  DEACTIVATED: { bg: "bg-stone-200 border-stone-300 text-stone-700", text: "Deactivated", icon: AlertTriangle },
};

export default async function MemberDetailsPage({ params }: MemberDetailsPageProps) {
  const user = await requireStaffOrAdmin();
  const isAdmin = (user as any).role === "ADMIN";
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      membershipType: true,
      payments: {
        orderBy: { paymentDate: "desc" },
      },
      registrations: {
        include: { event: true },
        orderBy: { registeredAt: "desc" },
      },
    },
  });

  if (!member) {
    notFound();
  }

  const age = calculateAge(member.dateOfBirth);
  const statusInfo = statusColors[member.status] || statusColors.PENDING;
  const StatusIcon = statusInfo.icon;
  const interestList = member.interestAreas ? member.interestAreas.split(",").map((s) => s.trim()) : [];

  // Check latest payment for expiry info
  const latestPayment = member.payments[0] || null;
  const isExpired = latestPayment ? new Date(latestPayment.expiryDate) < new Date() : true;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Members Roster</span>
        </Link>

        <Link
          href={`/admin/members/${member.id}/edit`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-300 hover:bg-white text-xs font-semibold text-stone-700 shadow-sm transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-4">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-sm">
                {member.fullName.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                  {member.fullName}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                  {member.memberCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusInfo.text}</span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-stone-500 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" /> {member.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" /> {member.phone}
                </span>
                <span>•</span>
                <span>Age: <strong>{age}</strong></span>
                {member.isMinor && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Under 18
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Approve, Reject, Deactivate, Delete */}
          <MemberActionButtons
            memberId={member.id}
            memberCode={member.memberCode}
            fullName={member.fullName}
            currentStatus={member.status}
            isAdmin={isAdmin}
          />
        </div>

        {/* 2-Column Grid for Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          {/* Left Column (2 Cols): Personal, Interests, Minor, Emergency */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-stone-500 block mb-0.5">Residential Address</span>
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {member.address}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block mb-0.5">Date of Birth</span>
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {new Date(member.dateOfBirth).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block mb-0.5">Gender</span>
                  <span className="font-semibold text-stone-900 capitalize">
                    {member.gender || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block mb-0.5">Occupation / School</span>
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {member.occupation}
                  </span>
                </div>
              </div>
            </div>

            {/* Under-18 Guardian Info (if isMinor) */}
            {member.isMinor && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-600" />
                  Parent / Legal Guardian Consent Record
                </h3>
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-amber-950">
                  <div>
                    <span className="text-amber-800 block mb-0.5">Guardian Name</span>
                    <span className="font-bold">{member.guardianName || "Not recorded"}</span>
                  </div>
                  <div>
                    <span className="text-amber-800 block mb-0.5">Guardian Phone</span>
                    <span className="font-bold">{member.guardianPhone || "Not recorded"}</span>
                  </div>
                  <div className="sm:col-span-2 pt-1 border-t border-amber-200/60 flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Parental consent explicitly granted at registration</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interest Areas */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Activity Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {interestList.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="capitalize">{interest}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Protected Emergency Contact & Health Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Confidential Safety & Health Record
                </h3>
                <span className="text-[10px] text-stone-400">🔒 Staff Role Protected</span>
              </div>
              <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200/70 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-stone-500 block mb-0.5">Emergency Contact</span>
                    <span className="font-bold text-stone-900">{member.emergencyContactName}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-0.5">Emergency Phone</span>
                    <span className="font-bold text-stone-900">{member.emergencyContactPhone}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-200/50">
                  <span className="text-stone-500 block mb-0.5">Allergies / Health Notes</span>
                  <p className="font-medium text-stone-800 leading-relaxed">
                    {member.healthNotes || "No medical conditions or allergies declared."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Tier, Expiry, Activity Stats */}
          <div className="space-y-6">
            {/* Membership Tier & Status */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Trees className="w-4 h-4 text-emerald-700" />
                Membership Tier
              </h3>
              <div>
                <span className="text-xl font-black text-emerald-950 block">
                  {member.membershipType?.name || "Standard Member"}
                </span>
                <span className="text-xs text-stone-500">
                  Annual Dues: ${member.membershipType?.fee || 0} / year
                </span>
              </div>

              <div className="pt-3 border-t border-stone-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Registered</span>
                  <span className="font-medium text-stone-800">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Dues Status</span>
                  {latestPayment ? (
                    isExpired ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Unpaid
                    </span>
                  )}
                </div>

                {latestPayment && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Expires</span>
                    <span className="font-medium text-stone-800">
                      {new Date(latestPayment.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Record Payment Button */}
              <div className="pt-2">
                <RecordPaymentModal
                  members={[
                    {
                      id: member.id,
                      memberCode: member.memberCode,
                      fullName: member.fullName,
                      email: member.email,
                      status: member.status,
                      membershipType: member.membershipType,
                    },
                  ]}
                  preselectedMemberId={member.id}
                  triggerButtonText="Log Fee Payment"
                  triggerButtonClass="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                />
              </div>

              {/* Payment Receipts History */}
              {member.payments.length > 0 && (
                <div className="pt-3 border-t border-stone-200 space-y-2">
                  <span className="text-[11px] font-bold text-stone-600 block">
                    Payment Receipts ({member.payments.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {member.payments.map((pay) => (
                      <div
                        key={pay.id}
                        className="bg-white p-2.5 rounded-xl border border-stone-200 text-[11px] space-y-0.5"
                      >
                        <div className="flex justify-between font-bold text-stone-900">
                          <span>${pay.amount.toFixed(2)}</span>
                          <span className="text-stone-500 font-normal">
                            {new Date(pay.paymentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 flex justify-between">
                          <span>{pay.paymentMethod}</span>
                          <span>Expires: {new Date(pay.expiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Event Participation Count */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-700" />
                Activity Participation
              </h3>
              <div className="text-3xl font-black text-emerald-800">
                {member.registrations.filter((r) => r.attended).length}
                <span className="text-xs font-normal text-stone-500 ml-1">
                  outings attended
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Total event registrations: {member.registrations.length}
              </p>

              {member.registrations.length > 0 && (
                <div className="pt-2 border-t border-stone-200 space-y-1.5 max-h-48 overflow-y-auto">
                  {member.registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/admin/events/${reg.eventId}`}
                          className="font-bold text-stone-900 hover:text-emerald-700 leading-snug line-clamp-1"
                        >
                          {reg.event.title}
                        </Link>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ml-2 ${
                            reg.attended
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {reg.attended ? "Attended" : "Registered"}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {new Date(reg.event.dateTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes */}
            {member.adminNotes && (
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Internal Warden Notes
                </h3>
                <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200 leading-relaxed">
                  {member.adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
