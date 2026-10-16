import Link from "next/link";
import { Trees, Compass, ShieldCheck, User, Sparkles, LayoutDashboard } from "lucide-react";
import { auth } from "@/auth";

export default async function Navbar() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  return (
    <header className="sticky top-0 z-50 bg-emerald-900/95 backdrop-blur text-emerald-50 border-b border-emerald-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 group-hover:bg-emerald-600 flex items-center justify-center text-emerald-100 shadow transition-colors">
              <Trees className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                Nature Club
              </span>
              <span className="text-xs text-emerald-300 font-medium tracking-wider uppercase">
                Explore • Protect • Connect
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="text-emerald-100 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Discover</span>
            </Link>
            <Link
              href="/#activities"
              className="text-emerald-100 hover:text-white transition-colors"
            >
              Activities
            </Link>
            <Link
              href="/rules"
              className="text-emerald-100 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Rules & Safety</span>
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {role === "MEMBER" ? (
              <Link
                href="/portal/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-800 text-emerald-100 hover:text-white hover:bg-emerald-700 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Member Portal</span>
              </Link>
            ) : role === "ADMIN" || role === "STAFF" ? (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-800 text-emerald-100 hover:text-white hover:bg-emerald-700 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Sign In</span>
              </Link>
            )}

            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Join the Club</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
