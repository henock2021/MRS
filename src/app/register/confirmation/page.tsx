"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/navigation";
import { Suspense, useState } from "react";
import { CheckCircle2, Copy, Check, Trees, ArrowRight, ShieldCheck, Clock, CreditCard } from "lucide-react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const memberCode = searchParams.get("code") || "NC-000100";
  const fullName = searchParams.get("name") || "Valued Applicant";
  const email = searchParams.get("email") || "";
  const membershipType = searchParams.get("type") || "Standard";

  const handleCopy = () => {
    navigator.clipboard.writeText(memberCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700/80 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-200 shadow">
            <CheckCircle2 className="w-10 h-10 text-emerald-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Application Received!
          </h1>
          <p className="text-emerald-100 text-sm max-w-md mx-auto">
            Welcome to the flock, <strong>{fullName}</strong>. Your membership registration has been recorded and is currently under review.
          </p>
        </div>

        {/* Member ID Card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              Your Unique Member ID
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-950 tracking-wider">
              {memberCode}
            </div>
            <p className="text-xs text-stone-500">
              Please save this ID. You will need it to reference your application and payments.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Member ID"}</span>
              </button>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs sm:text-sm space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
              <span className="text-stone-500">Applicant Name</span>
              <span className="font-semibold text-stone-900">{fullName}</span>
            </div>
            {email && (
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Registered Email</span>
                <span className="font-medium text-stone-900">{email}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
              <span className="text-stone-500">Membership Tier</span>
              <span className="font-semibold text-stone-900">{membershipType}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-stone-500">Current Status</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-3 h-3" />
                <span>Pending Approval</span>
              </span>
            </div>
          </div>

          {/* Roadmap: What happens next */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wide">
              What Happens Next?
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900">Warden Verification</h4>
                  <p className="text-xs text-stone-600">
                    Our club coordinators review new submissions to ensure safety records and contact info are complete.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900">Approval & Dues Payment</h4>
                  <p className="text-xs text-stone-600">
                    Once approved, your annual fee will be recorded (cash, bank transfer, or mobile money) to activate your expiry date.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900">Member Portal & Outing RSVPs</h4>
                  <p className="text-xs text-stone-600">
                    You can log in to your personal member portal, book spots on trail hikes, and manage your activity history.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-1/2 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors text-center"
            >
              Print Confirmation Summary
            </button>
            <a
              href="/"
              className="w-full sm:w-1/2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors text-center inline-flex items-center justify-center gap-1.5"
            >
              <span>Return to Homepage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 text-center text-stone-500 text-sm">
          Loading registration details...
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
