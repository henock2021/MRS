import Link from "next/link";
import { Trees, Heart, Shield, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-200 border-t border-emerald-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-emerald-100">
                <Trees className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">Nature Club</span>
            </div>
            <p className="text-sm text-emerald-300 max-w-md leading-relaxed">
              We are a passionate community of outdoor adventurers, conservationists, and nature stewards.
              Together, we hike the trails, restore native forests, protect bird habitats, and inspire environmental education.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400">
              <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Leave No Trace • Respect Every Living Trail</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase">Activities</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-white transition-colors">Trail Hiking</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Bird Watching</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Tree Planting Drives</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">River Clean-up</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Wilderness Camping</Link></li>
            </ul>
          </div>

          {/* Member & Club Info */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase">Club Information</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rules" className="hover:text-white transition-colors flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" />Rules & Safety Policy</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Membership Types & Dues</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Member & Staff Login</Link></li>
            </ul>
            <div className="pt-2 text-xs text-emerald-400 space-y-1">
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> contact@natureclub.org</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +1 (555) 019-NATURE</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400">
          <p>© {new Date().getFullYear()} Nature Club. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built with Next.js, Prisma & SQLite</p>
        </div>
      </div>
    </footer>
  );
}
