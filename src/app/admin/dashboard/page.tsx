import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CreditCard,
  Compass,
  ArrowRight,
  TrendingUp,
  MapPin,
  Trees,
} from "lucide-react";
import InterestDistributionChart from "@/components/admin/InterestDistributionChart";
import { INTEREST_AREAS } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Parallel database queries for dashboard metrics
  const [
    totalMembers,
    newThisMonth,
    pendingApprovals,
    expiringSoonCount,
    upcomingEventsCount,
    attendanceThisMonth,
    paymentsThisMonthRecords,
    allMembersInterests,
    recentPendingMembers,
    nextUpcomingEvent,
  ] = await Promise.all([
    // 1. Total members
    prisma.member.count(),
    // 2. New this month
    prisma.member.count({ where: { createdAt: { gte: startOfMonth } } }),
    // 3. Pending approvals
    prisma.member.count({ where: { status: "PENDING" } }),
    // 4. Expiring soon (within 30 days)
    prisma.payment.count({
      where: {
        expiryDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    }),
    // 5. Upcoming events
    prisma.event.count({ where: { dateTime: { gte: now } } }),
    // 6. Attendance this month
    prisma.eventRegistration.count({
      where: {
        attended: true,
        event: { dateTime: { gte: startOfMonth } },
      },
    }),
    // 7. Payments this month
    prisma.payment.findMany({
      where: { paymentDate: { gte: startOfMonth } },
      select: { amount: true },
    }),
    // All members for interest distribution
    prisma.member.findMany({
      select: { interestAreas: true },
    }),
    // Recent pending members
    prisma.member.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { membershipType: true },
    }),
    // Next upcoming event
    prisma.event.findFirst({
      where: { dateTime: { gte: now } },
      orderBy: { dateTime: "asc" },
      include: {
        _count: { select: { registrations: true } },
      },
    }),
  ]);

  const totalPaymentsAmountThisMonth = paymentsThisMonthRecords.reduce(
    (acc, p) => acc + p.amount,
    0
  );

  // Calculate Interest Area distribution
  const interestStats = INTEREST_AREAS.map((item) => {
    const matchingCount = allMembersInterests.filter((m) =>
      m.interestAreas.toLowerCase().includes(item.id.toLowerCase())
    ).length;
    const percentage = totalMembers > 0 ? Math.round((matchingCount / totalMembers) * 100) : 0;
    return {
      id: item.id,
      label: item.label,
      count: matchingCount,
      percentage,
    };
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-300 text-xs font-semibold backdrop-blur border border-emerald-700/60">
            <Trees className="w-3.5 h-3.5" />
            <span>Nature Club Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Club Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
            Monitor member registration volume, dues cashflow, upcoming outings, and community participation.
          </p>
        </div>
      </div>

      {/* 7 Key Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Members */}
        <Link
          href="/admin/members"
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Total Members</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">{totalMembers}</div>
          <p className="text-[11px] text-stone-400">All registered naturalist profiles</p>
        </Link>

        {/* 2. New This Month */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">New This Month</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">+{newThisMonth}</div>
          <p className="text-[11px] text-stone-400">Applications joined this month</p>
        </div>

        {/* 3. Pending Approvals */}
        <Link
          href="/admin/members?status=PENDING"
          className={`rounded-2xl border p-5 shadow-sm space-y-2 transition-all ${
            pendingApprovals > 0
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50 hover:bg-amber-50"
              : "bg-white border-stone-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-950">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-900">{pendingApprovals}</div>
          <p className="text-[11px] text-amber-800">Applications awaiting review</p>
        </Link>

        {/* 4. Expiring Soon */}
        <Link
          href="/admin/payments?filter=expiring_soon"
          className={`rounded-2xl border p-5 shadow-sm space-y-2 transition-all ${
            expiringSoonCount > 0
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50 hover:bg-amber-50"
              : "bg-white border-stone-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-950">Expiring in 30 Days</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-900">{expiringSoonCount}</div>
          <p className="text-[11px] text-amber-800">Members due for dues renewal</p>
        </Link>

        {/* 5. Upcoming Events */}
        <Link
          href="/admin/events?filter=upcoming"
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Upcoming Outings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">{upcomingEventsCount}</div>
          <p className="text-[11px] text-stone-400">Scheduled trail excursions</p>
        </Link>

        {/* 6. Total Attendance This Month */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Attendance This Month</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-800">{attendanceThisMonth}</div>
          <p className="text-[11px] text-stone-400">Members checked-in on trails</p>
        </div>

        {/* 7. Payments This Month */}
        <Link
          href="/admin/payments"
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all space-y-2 sm:col-span-2 lg:col-span-2 group"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Payments Collected This Month</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-800">
            ${totalPaymentsAmountThisMonth.toFixed(2)}
          </div>
          <p className="text-[11px] text-stone-400">
            {paymentsThisMonthRecords.length} receipts recorded this calendar month
          </p>
        </Link>
      </div>

      {/* 2-Column Section: Interest Distribution Chart & Quick Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Interest Area Distribution Chart */}
        <div className="lg:col-span-2">
          <InterestDistributionChart
            data={interestStats}
            totalMembers={totalMembers}
          />
        </div>

        {/* Right Column (1 Col): Next Outing & Pending Approvals */}
        <div className="space-y-6">
          {/* Next Upcoming Event Card */}
          {nextUpcomingEvent ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Next Outing
                </span>
                <span className="text-xs text-stone-500">
                  {new Date(nextUpcomingEvent.dateTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-stone-900 leading-snug">
                  {nextUpcomingEvent.title}
                </h3>
                <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{nextUpcomingEvent.meetingPoint}</span>
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Capacity Filled</span>
                  <span>
                    <strong>{nextUpcomingEvent._count.registrations}</strong> / {nextUpcomingEvent.capacity}
                  </span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (nextUpcomingEvent._count.registrations / nextUpcomingEvent.capacity) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <Link
                  href={`/admin/events/${nextUpcomingEvent.id}`}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Manage Outing Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm text-center space-y-2">
              <Calendar className="w-6 h-6 text-stone-400 mx-auto" />
              <p className="text-xs text-stone-500">No upcoming outings scheduled.</p>
              <Link
                href="/admin/events"
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                Schedule an outing &rarr;
              </Link>
            </div>
          )}

          {/* Pending Approvals Widget */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                Pending Approvals ({pendingApprovals})
              </h3>
              <Link
                href="/admin/members?status=PENDING"
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
              >
                View all &rarr;
              </Link>
            </div>

            {recentPendingMembers.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">
                All membership applications are currently reviewed!
              </p>
            ) : (
              <div className="space-y-3">
                {recentPendingMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block truncate max-w-[140px]">
                        {m.fullName}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {m.memberCode} • {m.membershipType?.name || "Standard"}
                      </span>
                    </div>
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[11px] transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
