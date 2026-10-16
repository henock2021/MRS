"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, CreditCard, User } from "lucide-react";

export default function MemberMobileNav() {
  const pathname = usePathname();

  const links = [
    { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/events", label: "Outings", icon: Calendar },
    { href: "/portal/payments", label: "Dues", icon: CreditCard },
    { href: "/portal/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden flex items-center justify-around border-t border-emerald-900 bg-emerald-950/90 px-2 py-2 text-xs">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg font-medium transition-colors ${
              isActive
                ? "text-emerald-300 bg-emerald-900/60 font-bold"
                : "text-emerald-200/80 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px]">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
