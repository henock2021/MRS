import Link from "next/link";
import { ShieldCheck, Trees, AlertTriangle, HeartHandshake, CheckCircle2, ArrowLeft } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/register"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Registration
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Header */}
        <div className="border-b border-stone-100 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Community Guidelines & Safety Principles</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Nature Club Rules & Safety Acknowledgement
          </h1>
          <p className="text-stone-600 text-sm">
            Last updated: October 2026. Every applicant and club participant must abide by these principles.
          </p>
        </div>

        {/* Section 1: Leave No Trace & Environmental Ethics */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <Trees className="w-5 h-5 text-emerald-600" />
            1. Leave No Trace & Conservation Ethics
          </h2>
          <ul className="space-y-2 text-sm text-stone-700 pl-4 border-l-2 border-emerald-500">
            <li><strong>Pack It In, Pack It Out:</strong> All trash, plastic wrappers, food scraps, and gear must be carried back with you.</li>
            <li><strong>Stay on Designated Trails:</strong> Prevent soil erosion and trampling of delicate flora by remaining on marked footpaths.</li>
            <li><strong>Respect Wildlife:</strong> Observe animals from a quiet, safe distance. Never feed wild creatures or disturb nesting habitats.</li>
            <li><strong>Preserve Natural Heritage:</strong> Leave rocks, wildflowers, driftwood, and artifacts exactly where you discover them.</li>
          </ul>
        </div>

        {/* Section 2: Trail Safety & Physical Preparedness */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            2. Safety Protocol & Personal Preparedness
          </h2>
          <ul className="space-y-2 text-sm text-stone-700 pl-4 border-l-2 border-amber-500">
            <li><strong>Footwear & Hydration:</strong> Sturdy hiking shoes/boots and adequate drinking water (minimum 1.5L on day hikes) are mandatory.</li>
            <li><strong>Follow Trail Leaders:</strong> Never hike ahead of the forward scout or behind the designated tail-sweep without coordinator approval.</li>
            <li><strong>Medical Disclosures:</strong> Members must inform trip leaders in confidence of any serious allergies (e.g. bee venom) or medical conditions before departure.</li>
            <li><strong>Weather Cancellations:</strong> Club leaders hold full authority to reroute or postpone trips due to flash floods, thunderstorms, or fire danger.</li>
          </ul>
        </div>

        {/* Section 3: Youth & Minors Policy */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            3. Minors & Youth Participation Policy (Under 18)
          </h2>
          <ul className="space-y-2 text-sm text-stone-700 pl-4 border-l-2 border-emerald-500">
            <li>All applicants under 18 years of age require written consent from a parent or legal guardian.</li>
            <li>Children under 14 must be accompanied by an adult or legal guardian during wilderness outings and overnight camps.</li>
          </ul>
        </div>

        {/* Section 4: Liability & Risk Waiver */}
        <div className="space-y-4 bg-stone-50 p-6 rounded-xl border border-stone-200">
          <h2 className="text-base font-bold text-stone-900">
            4. Safety & Liability Acknowledgment (Waiver of Liability)
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            By checking the Safety & Liability Waiver on the registration form, you acknowledge that outdoor activities—including hiking, tree planting, clean-ups, water activities, and camping—involve inherent environmental risks such as uneven terrain, weather variations, insects, and wildlife encounters.
          </p>
          <p className="text-xs text-stone-600 leading-relaxed mt-2">
            You agree to assume voluntary responsibility for your personal safety, exercise sound judgment, adhere to instructions given by trip coordinators, and hold the club, its volunteer organizers, and property custodians harmless against accidental injury or loss not caused by gross negligence.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-stone-100">
          <p className="text-xs text-stone-500">Questions? Email us at safety@natureclub.org</p>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            I Understand — Proceed to Register
          </Link>
        </div>
      </div>
    </div>
  );
}
