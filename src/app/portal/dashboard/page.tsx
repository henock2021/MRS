import { requireMemberSession } from "@/lib/auth-utils";
import Link from "next/link";
import {
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Compass,
} from "lucide-react";
import { getExpiryStatus } from "@/lib/payment-utils";

export default async function MemberDashboardPage() {
  const { member } = await requireMemberSession();

  // 1. Calculate latest expiry date from member payments
  const latestPayment = member.payments.length > 0
    ? member.payments.reduce((latest, current) =>
        new Date(current.expiryDate) > new Date(latest.expiryDate) ? current : latest
      )
    : null;

  const expiryInfo = getExpiryStatus(latestPayment?.expiryDate);

  // 2. Count attendance metrics
  const totalAttended = member.registrations.filter((r) => r.attended).length;
  const upcomingRegistrations = member.registrations.filter(
    (r) => !r.attended && new Date(r.event.dateTime) >= new Date()
  );

  // 3. Find immediate next registered outing
  const nextOuting = upcomingRegistrations.sort(
    (a, b) => new Date(a.event.dateTime).getTime() - new Date(b.event.dateTime).getTime()
  )[0];

  // 4. Parse interest areas
  const interests = member.interestAreas
    ? member.interestAreas.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Nature Club Member Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {member.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl">
              Member ID: <strong className="font-mono text-white">{member.memberCode}</strong> •{" "}
              {member.membershipType?.name || "General"} Tier
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal/events"
              className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs sm:text-sm shadow transition-all inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Browse Outings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Expiry Alert Warning if Expiring Soon or Expired */}
      {expiryInfo.status === "EXPIRING_SOON" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Membership Renewal Notice:</span>
            <p className="leading-relaxed">
              Your annual club dues expire in <strong>{expiryInfo.daysRemaining} days</strong> (on{" "}
              {new Date(latestPayment!.expiryDate).toLocaleDateString()}). Please renew with a coordinator at
              the next club meeting or via bank transfer to keep enjoying guided outings.
            </p>
          </div>
        </div>
      )}

      {expiryInfo.status === "EXPIRED" && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-3 text-rose-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Membership Expired:</span>
            <p className="leading-relaxed">
              Your membership dues expired on{" "}
              {new Date(latestPayment!.expiryDate).toLocaleDateString()}. Please reach out to club staff or renew
              your dues to maintain active outing registration privileges.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Membership Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Membership Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-extrabold text-stone-900">
              {member.membershipType?.name || "Member"}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved & Active</span>
            </div>
          </div>
        </div>

        {/* Card 2: Expiry Date */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Validity & Expiry</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-extrabold text-stone-900">
              {latestPayment
                ? new Date(latestPayment.expiryDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No Record"}
            </div>
            <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${expiryInfo.badgeClass}`}>
              {expiryInfo.label}
            </div>
          </div>
        </div>

        {/* Card 3: Outings Attended */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outings Attended</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-emerald-900">{totalAttended}</div>
            <p className="text-[11px] text-stone-500">Nature outings & activities completed</p>
          </div>
        </div>

        {/* Card 4: Upcoming Spots */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Spots</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-emerald-900">
              {upcomingRegistrations.length}
            </div>
            <p className="text-[11px] text-stone-500">Active registrations in club calendar</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Next Outing + Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Outing Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-sm text-stone-900">Your Next Scheduled Outing</h2>
            </div>
            <Link
              href="/portal/events"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {nextOuting ? (
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-2.5 py-0.5 rounded-full bg-emerald-100 inline-block mb-1">
                    {nextOuting.event.eventType}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900">{nextOuting.event.title}</h3>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                    Spot Confirmed
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {nextOuting.event.description}
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 border-t border-stone-200/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {new Date(nextOuting.event.dateTime).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{nextOuting.event.meetingPoint}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-stone-800">
                  No upcoming outing reservations
                </p>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  You are not currently registered for any upcoming activities. Explore our upcoming hikes, clean-ups, and workshops!
                </p>
              </div>
              <Link
                href="/portal/events"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-600 shadow transition-all"
              >
                <span>Browse Upcoming Outings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Member Profile Quick Card (1 Col) */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>My Member Details</span>
            </h2>
            <Link
              href="/portal/profile"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Edit
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                Phone Number
              </span>
              <span className="font-medium text-stone-800">{member.phone}</span>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                Emergency Contact
              </span>
              <span className="font-medium text-stone-800">
                {member.emergencyContactName} ({member.emergencyContactPhone})
              </span>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                Registered Interests
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-100 capitalize"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <Link
                href="/portal/profile"
                className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Update Contact & Medical Info</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
