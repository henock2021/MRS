"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 rounded-xl transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}
