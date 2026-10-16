import { requireStaffOrAdmin } from "@/lib/auth-utils";
import Link from "next/link";
import {
  Trees,
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Layers,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication and role check:
  // Throws/redirects to /login if user is not ADMIN or STAFF
  const user = await requireStaffOrAdmin();
  const role = (user as any).role;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-100">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-emerald-950 text-emerald-100 flex flex-col shrink-0 border-r border-emerald-900">
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-900 flex items-center justify-between">
          <Link href="/admin/members" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight block">
                Nature Club Admin
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                Staff & Operations
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-emerald-900/50 border border-emerald-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-white truncate max-w-[140px]">
              {user.name || "Staff Officer"}
            </span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              role === "ADMIN" ? "bg-amber-400 text-stone-950" : "bg-emerald-400 text-emerald-950"
            }`}>
              {role}
            </span>
          </div>
          <p className="text-[11px] text-emerald-300 truncate">{user.email}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 py-2 text-xs font-medium">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/members"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Members Roster</span>
          </Link>

          <Link
            href="/admin/membership-types"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Membership Tiers</span>
          </Link>

          <Link
            href="/admin/payments"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Payments & Expiry</span>
          </Link>

          <Link
            href="/admin/events"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Club Events</span>
          </Link>

          {role === "ADMIN" && (
            <Link
              href="/admin/staff"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Staff Accounts</span>
            </Link>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-emerald-900 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-300 hover:text-white hover:bg-emerald-900/40 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Public Website</span>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
