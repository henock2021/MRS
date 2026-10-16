import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Compass,
  MapPin,
  Users,
  DollarSign,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Phone,
  Mail,
  ShieldAlert,
} from "lucide-react";
import AttendanceCheckbox from "@/components/admin/AttendanceCheckbox";
import RegisterMemberModal from "@/components/admin/RegisterMemberModal";
import RemoveParticipantButton from "@/components/admin/RemoveParticipantButton";
import DeleteEventButton from "@/components/admin/DeleteEventButton";
import { requireStaffOrAdmin } from "@/lib/auth-utils";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const user = await requireStaffOrAdmin();
  const isAdmin = (user as any).role === "ADMIN";
  const { id } = await params;

  const [event, allMembers] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            member: {
              select: {
                id: true,
                memberCode: true,
                fullName: true,
                email: true,
                phone: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
                healthNotes: true,
                status: true,
              },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
      },
    }),
    prisma.member.findMany({
      where: { status: { in: ["APPROVED", "PENDING"] } },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        memberCode: true,
        fullName: true,
        email: true,
        status: true,
      },
    }),
  ]);

  if (!event) {
    notFound();
  }

  const registeredMemberIds = new Set(event.registrations.map((r) => r.memberId));
  const availableMembers = allMembers.filter((m) => !registeredMemberIds.has(m.id));
  const attendedCount = event.registrations.filter((r) => r.attended).length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Outings</span>
        </Link>
      </div>

      {/* Event Overview Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                {event.eventType}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                {event.fee === 0 ? "Free Event" : `$${event.fee} Fee`}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {event.registrations.length} / {event.capacity} Filled
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {event.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-stone-800">
                <Calendar className="w-4 h-4 text-emerald-700" />
                {new Date(event.dateTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                {event.meetingPoint}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/export/events/${event.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-sm transition-colors"
              title="Download Safety Sheet with Emergency Contacts"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Export Trip Safety Sheet (CSV)</span>
            </a>

            <RegisterMemberModal
              eventId={event.id}
              eventTitle={event.title}
              capacity={event.capacity}
              currentCount={event.registrations.length}
              availableMembers={availableMembers}
            />

            {isAdmin && (
              <DeleteEventButton eventId={event.id} eventTitle={event.title} />
            )}
          </div>
        </div>

        {/* Description */}
        <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <strong className="text-stone-900 block mb-1">Outing Description & Trail Details:</strong>
          <p>{event.description}</p>
        </div>

        {/* Participant Roster & Attendance Checklist */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Participant Roster & Trip Safety Checklist</span>
              </h2>
              <p className="text-xs text-stone-500">
                Mark attendance on the trail and reference verified emergency contacts.
              </p>
            </div>

            <div className="text-xs bg-emerald-50 text-emerald-900 px-3 py-1 rounded-xl font-bold border border-emerald-200 self-start sm:self-auto">
              Checked In: {attendedCount} / {event.registrations.length} attended
            </div>
          </div>

          {event.registrations.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <Users className="w-8 h-8 text-stone-400 mx-auto" />
              <h4 className="text-xs font-bold text-stone-700">No participants registered yet</h4>
              <p className="text-[11px] text-stone-500">
                Click &ldquo;Add Member to Outing&rdquo; to sign up club naturalists.
              </p>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Emergency Contact (Safety)</th>
                      <th className="py-3 px-4">Health / Allergies</th>
                      <th className="py-3 px-4">Attendance Check</th>
                      <th className="py-3 px-4 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {event.registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-emerald-50/30 transition-colors">
                        {/* Member */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/members/${reg.member.id}`}
                            className="font-bold text-emerald-950 hover:underline block"
                          >
                            {reg.member.fullName}
                          </Link>
                          <span className="font-mono text-[10px] text-stone-500">
                            {reg.member.memberCode}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4 text-[11px] text-stone-600 space-y-0.5">
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {reg.member.phone}
                          </p>
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {reg.member.email}
                          </p>
                        </td>

                        {/* Emergency Contact */}
                        <td className="py-3 px-4 text-[11px]">
                          <span className="font-bold text-stone-900 block">
                            {reg.member.emergencyContactName}
                          </span>
                          <span className="text-stone-600 font-mono">
                            {reg.member.emergencyContactPhone}
                          </span>
                        </td>

                        {/* Health Notes */}
                        <td className="py-3 px-4 text-[11px]">
                          {reg.member.healthNotes ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                              {reg.member.healthNotes}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">None noted</span>
                          )}
                        </td>

                        {/* Attendance Toggle */}
                        <td className="py-3 px-4">
                          <AttendanceCheckbox
                            eventId={event.id}
                            memberId={reg.member.id}
                            initialAttended={reg.attended}
                            memberName={reg.member.fullName}
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <RemoveParticipantButton
                            eventId={event.id}
                            memberId={reg.member.id}
                            memberName={reg.member.fullName}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
