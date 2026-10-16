import { requireMemberSession } from "@/lib/auth-utils";
import Link from "next/link";
import {
  Trees,
  LayoutDashboard,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";
import MemberMobileNav from "@/components/portal/MemberMobileNav";

export default async function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication and membership status guard:
  // Strictly loads member record by session.user.id and verifies status === APPROVED.
  // Throws/redirects if unauthorized or inactive.
  const { user, member } = await requireMemberSession();

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-emerald-950 text-white border-b border-emerald-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Area Indicator */}
            <div className="flex items-center gap-6">
              <Link href="/portal/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow group-hover:bg-emerald-600 transition-colors">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-white tracking-tight block">
                    Nature Club
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Member Portal
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-emerald-900 text-xs font-semibold">
                <Link
                  href="/portal/dashboard"
                  className="px-3.5 py-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/portal/events"
                  className="px-3.5 py-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Club Outings</span>
                </Link>
                <Link
                  href="/portal/payments"
                  className="px-3.5 py-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Dues & Payments</span>
                </Link>
                <Link
                  href="/portal/profile"
                  className="px-3.5 py-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>My Profile</span>
                </Link>
              </nav>
            </div>

            {/* Member Profile Pill & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-900/80 border border-emerald-800 text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-xs text-white uppercase">
                  {member.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                    <span>{member.fullName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-200 font-semibold">
                      {member.memberCode}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {member.membershipType?.name || "Member"} • Active
                  </div>
                </div>
              </div>

              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <MemberMobileNav />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
