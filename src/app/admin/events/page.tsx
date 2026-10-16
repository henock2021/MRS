import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Compass,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Binoculars,
  Shovel,
  Sparkles,
  Tent,
  GraduationCap,
} from "lucide-react";
import CreateEventModal from "@/components/admin/CreateEventModal";

interface EventsPageProps {
  searchParams?: Promise<{
    filter?: string;
    type?: string;
  }>;
}

const eventTypeIcons: Record<string, React.ElementType> = {
  hike: Compass,
  "tree planting": Shovel,
  "clean-up": Sparkles,
  "bird watching": Binoculars,
  camping: Tent,
  workshop: GraduationCap,
};

export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeFilter = resolvedParams.filter || "all";
  const typeFilter = resolvedParams.type || "";

  const now = new Date();

  // Query events
  const where: any = {};

  if (activeFilter === "upcoming") {
    where.dateTime = { gte: now };
  } else if (activeFilter === "past") {
    where.dateTime = { lt: now };
  }

  if (typeFilter) {
    where.eventType = typeFilter;
  }

  const [events, allEvents] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { dateTime: "asc" },
      include: {
        _count: { select: { registrations: true } },
      },
    }),
    prisma.event.findMany({
      select: {
        id: true,
        dateTime: true,
        capacity: true,
        _count: { select: { registrations: true } },
      },
    }),
  ]);

  const totalEvents = allEvents.length;
  const upcomingCount = allEvents.filter((e) => new Date(e.dateTime) >= now).length;
  const pastCount = allEvents.filter((e) => new Date(e.dateTime) < now).length;
  const totalRegistrations = allEvents.reduce((acc, e) => acc + e._count.registrations, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Club Activities & Events
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Organize trail hikes, river clean-ups, tree plantings, and oversee participant rosters.
          </p>
        </div>

        <CreateEventModal />
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500">Total Outings Scheduled</span>
          <div className="text-2xl font-black text-stone-900">{totalEvents}</div>
          <p className="text-[11px] text-stone-400">All planned activities</p>
        </div>

        <Link
          href="/admin/events?filter=upcoming"
          className={`rounded-2xl border p-5 shadow-sm space-y-1 transition-all ${
            activeFilter === "upcoming"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400"
              : "bg-white border-stone-200 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Upcoming Outings</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{upcomingCount}</div>
          <p className="text-[11px] text-emerald-800">Ready for member sign-ups</p>
        </Link>

        <Link
          href="/admin/events?filter=past"
          className={`rounded-2xl border p-5 shadow-sm space-y-1 transition-all ${
            activeFilter === "past"
              ? "bg-stone-100 border-stone-300 ring-2 ring-stone-400"
              : "bg-white border-stone-200 hover:border-stone-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">Past Activities</span>
            <Clock className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-black text-stone-700">{pastCount}</div>
          <p className="text-[11px] text-stone-500">Completed club trips</p>
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500">Total Registrations</span>
          <div className="text-2xl font-black text-emerald-800">{totalRegistrations}</div>
          <p className="text-[11px] text-stone-400">Spots booked by club members</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-medium">
        <Link
          href="/admin/events"
          className={`px-3.5 py-1.5 rounded-xl transition-colors ${
            activeFilter === "all"
              ? "bg-emerald-800 text-white font-semibold"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          All Outings ({totalEvents})
        </Link>
        <Link
          href="/admin/events?filter=upcoming"
          className={`px-3.5 py-1.5 rounded-xl transition-colors ${
            activeFilter === "upcoming"
              ? "bg-emerald-800 text-white font-semibold"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Upcoming Outings ({upcomingCount})
        </Link>
        <Link
          href="/admin/events?filter=past"
          className={`px-3.5 py-1.5 rounded-xl transition-colors ${
            activeFilter === "past"
              ? "bg-emerald-800 text-white font-semibold"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Past Outings ({pastCount})
        </Link>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">No events found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            No outings match your selected filter. Click &ldquo;Create Outing&rdquo; to plan an upcoming hike or activity.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const Icon = eventTypeIcons[ev.eventType] || Compass;
            const isPast = new Date(ev.dateTime) < now;
            const filledCount = ev._count.registrations;
            const percentage = Math.min(100, Math.round((filledCount / ev.capacity) * 100));

            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                      <Icon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ev.eventType}</span>
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isPast
                          ? "bg-stone-100 text-stone-500"
                          : ev.fee === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {isPast ? "Past" : ev.fee === 0 ? "Free" : `$${ev.fee}`}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-stone-900 line-clamp-1">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs text-stone-600">
                    <p className="flex items-center gap-1.5 font-medium text-stone-900">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      {new Date(ev.dateTime).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="flex items-center gap-1.5 text-stone-500 text-[11px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {ev.meetingPoint}
                    </p>
                  </div>

                  {/* Capacity Bar */}
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        <strong>{filledCount}</strong> / {ev.capacity} spots filled
                      </span>
                      <span className="font-bold text-stone-700">{percentage}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentage >= 100
                            ? "bg-rose-500"
                            : percentage >= 80
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {ev.capacity - filledCount > 0
                      ? `${ev.capacity - filledCount} spots left`
                      : "Full roster"}
                  </span>

                  <Link
                    href={`/admin/events/${ev.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors"
                  >
                    <span>Roster & Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
