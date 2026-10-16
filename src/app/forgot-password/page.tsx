"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Trees,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [directResetUrl, setDirectResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setDirectResetUrl(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || "Failed to process request.");
          return;
        }

        setSuccessMessage(data.message);
        if (data.debugResetUrl) {
          setDirectResetUrl(data.debugResetUrl);
        }
      } catch (err) {
        setErrorMessage("A network error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-[85vh] bg-stone-100 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 mx-auto flex items-center justify-center text-emerald-100 shadow">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-xs text-stone-500 leading-relaxed">
            Enter your registered email address and we'll generate a secure reset link
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMessage ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reset Instructions Generated</span>
              </div>
              <p className="leading-relaxed text-emerald-700">{successMessage}</p>
            </div>

            {/* Local testing helper */}
            {directResetUrl && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                <span className="font-bold text-stone-800 block text-[11px] uppercase tracking-wider">
                  Testing Shortcut (No SMTP Required):
                </span>
                <p className="text-stone-500 text-[11px]">
                  Since this environment runs locally without an email server, you can use this generated link directly:
                </p>
                <Link
                  href={directResetUrl}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <span>Open Password Reset Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-300 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating reset link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs text-stone-600 border-t border-stone-100">
              Remembered your password?{" "}
              <Link href="/login" className="text-emerald-700 hover:text-emerald-900 font-bold">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
