"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Trees, Mail, Lock, AlertCircle, ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/members";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          if (result.error.includes("RATE_LIMITED")) {
            setErrorMessage(
              "Too many failed login attempts. For security, please wait 15 minutes before trying again."
            );
          } else if (result.error.includes("MEMBER_NOT_APPROVED")) {
            setErrorMessage(
              "Your membership registration is currently pending review or is inactive. You can log in once approved by club coordinators."
            );
          } else {
            // Generic security error message to prevent account enumeration
            setErrorMessage("Invalid email or password. Please verify your credentials and try again.");
          }
          return;
        }

        // Successfully logged in: inspect user session to route to appropriate area
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;

        if (role === "MEMBER") {
          router.push("/portal/dashboard");
        } else if (searchParams.get("callbackUrl")) {
          router.push(searchParams.get("callbackUrl")!);
        } else {
          router.push("/admin/dashboard");
        }
        router.refresh();
      } catch (err) {
        setErrorMessage("An unexpected network error occurred. Please try again.");
      }
    });
  };

  const isActivated = searchParams.get("activated") === "true";

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 mx-auto flex items-center justify-center text-emerald-100 shadow">
            <Trees className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Sign In to Nature Club
          </h1>
          <p className="text-xs text-stone-500">
            Access the staff dashboard or your personal member portal
          </p>
        </div>

        {/* Activation Success Banner */}
        {isActivated && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Password set successfully! You can now log into the member portal.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Email Address
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
                placeholder="name@natureclub.org or member email"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Member Activation Link */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
          <p className="text-xs text-emerald-900 font-semibold mb-1">
            Approved Member First Time Here?
          </p>
          <Link
            href="/activate"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
          >
            <span>Activate account & set your password</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Helpful Testing Credentials */}
        <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 space-y-2 bg-stone-50 p-3.5 rounded-xl border">
          <p className="flex items-center gap-1.5 font-bold text-emerald-900">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Test Credentials for All Roles:
          </p>
          <div className="space-y-1.5 font-mono text-[10px] text-stone-700">
            <div className="p-1.5 bg-white rounded border border-stone-200">
              <span className="font-semibold text-emerald-800">Admin:</span> admin@natureclub.org / NatureAdmin2026!Secure
            </div>
            <div className="p-1.5 bg-white rounded border border-stone-200">
              <span className="font-semibold text-emerald-800">Staff:</span> staff@natureclub.org / NatureStaff2026!Secure
            </div>
            <div className="p-1.5 bg-white rounded border border-stone-200">
              <span className="font-semibold text-emerald-800">Member:</span> sarah.greenwood@example.com / MemberPass2026!Secure
            </div>
          </div>
        </div>

        {/* Register CTA */}
        <div className="text-center pt-1 text-xs text-stone-600">
          Not a member yet?{" "}
          <Link href="/register" className="text-emerald-700 hover:text-emerald-900 font-bold">
            Submit an application
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 text-center text-xs text-stone-500">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
