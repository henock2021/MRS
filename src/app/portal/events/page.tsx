import { requireMemberSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import EventRsvpCard from "@/components/portal/EventRsvpCard";
import { Calendar, Compass, History, CheckCircle2, MapPin } from "lucide-react";

export default async function MemberEventsPage() {
  const { member } = await requireMemberSession();

  // 1. Fetch upcoming published events
  const upcomingEvents = await prisma.event.findMany({
    where: {
      isPublished: true,
      dateTime: { gte: new Date() },
    },
    include: {
      registrations: true,
    },
    orderBy: { dateTime: "asc" },
  });

  // 2. Fetch member's past attended events
  const pastAttendedRegistrations = await prisma.eventRegistration.findMany({
    where: {
      memberId: member.id,
      attended: true,
    },
    include: {
      event: true,
    },
    orderBy: {
      event: { dateTime: "desc" },
    },
  });

  // Map events to include registration state for current member
  const formattedEvents = upcomingEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    eventType: ev.eventType,
    description: ev.description,
    meetingPoint: ev.meetingPoint,
    dateTime: ev.dateTime,
    capacity: ev.capacity,
    fee: ev.fee,
    registeredCount: ev.registrations.length,
    isRegistered: ev.registrations.some((r) => r.memberId === member.id),
  }));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          <span>Nature Club Adventures</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Club Outings & Activities
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Browse upcoming trail hikes, volunteer drives, and camping trips. Reserve or release your spot anytime.
        </p>
      </div>

      {/* Upcoming Events Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <h2 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <span>Upcoming Club Outings ({formattedEvents.length})</span>
          </h2>
        </div>

        {formattedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formattedEvents.map((ev) => (
              <EventRsvpCard key={ev.id} event={ev} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-700">No Upcoming Outings Scheduled</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Club leaders are currently planning new seasonal adventures. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Past Outing History */}
      <section className="space-y-4 pt-6 border-t border-stone-200">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <h2 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            <span>My Attended Outing History ({pastAttendedRegistrations.length})</span>
          </h2>
        </div>

        {pastAttendedRegistrations.length > 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden divide-y divide-stone-100">
            {pastAttendedRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-100 capitalize">
                      {reg.event.eventType}
                    </span>
                    <h4 className="font-bold text-sm text-stone-900">{reg.event.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span>
                      {new Date(reg.event.dateTime).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{reg.event.meetingPoint}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attended & Verified</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 text-xs text-stone-500 space-y-1">
            <p className="font-semibold text-stone-700">No past outings recorded yet</p>
            <p>Attend club outings and coordinators will check you in on the field roster!</p>
          </div>
        )}
      </section>
    </div>
  );
}
