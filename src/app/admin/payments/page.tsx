import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  ArrowRight,
} from "lucide-react";
import RecordPaymentModal from "@/components/admin/RecordPaymentModal";
import { getExpiryStatus } from "@/lib/payment-utils";

interface PaymentsPageProps {
  searchParams?: Promise<{
    filter?: string;
  }>;
}

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money",
  OTHER: "Other / Cheque",
};

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeFilter = resolvedParams.filter || "all";

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch all members for the payment modal dropdown
  const allMembers = await prisma.member.findMany({
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      memberCode: true,
      fullName: true,
      email: true,
      status: true,
      membershipType: {
        select: {
          id: true,
          name: true,
          fee: true,
          durationDays: true,
        },
      },
    },
  });

  // Query payments according to filter
  const where: any = {};
  if (activeFilter === "expiring_soon") {
    where.expiryDate = {
      gte: now,
      lte: thirtyDaysFromNow,
    };
  } else if (activeFilter === "expired") {
    where.expiryDate = {
      lt: now,
    };
  }

  // Fetch metrics and payment records
  const [payments, allPaymentsList] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        member: {
          select: {
            id: true,
            memberCode: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            membershipType: { select: { name: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      select: {
        amount: true,
        expiryDate: true,
      },
    }),
  ]);

  // Aggregate stats
  const totalRevenue = allPaymentsList.reduce((acc, p) => acc + p.amount, 0);
  const totalCount = allPaymentsList.length;
  const expiringSoonCount = allPaymentsList.filter(
    (p) => new Date(p.expiryDate) >= now && new Date(p.expiryDate) <= thirtyDaysFromNow
  ).length;
  const expiredCount = allPaymentsList.filter((p) => new Date(p.expiryDate) < now).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Payments & Expiry Tracking
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Log fee payments, track upcoming expirations, and oversee club dues.
          </p>
        </div>

        <RecordPaymentModal members={allMembers} />
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500">Total Dues Collected</span>
          <div className="text-2xl font-black text-emerald-800">${totalRevenue.toFixed(2)}</div>
          <p className="text-[11px] text-stone-400">{totalCount} total payment receipts</p>
        </div>

        {/* Expiring Soon Alert */}
        <Link
          href="/admin/payments?filter=expiring_soon"
          className={`rounded-2xl border p-5 shadow-sm space-y-1 transition-all ${
            activeFilter === "expiring_soon"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400"
              : "bg-white border-stone-200 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Expiring in 30 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{expiringSoonCount}</div>
          <p className="text-[11px] text-amber-800">Members due for annual renewal</p>
        </Link>

        {/* Already Expired Alert */}
        <Link
          href="/admin/payments?filter=expired"
          className={`rounded-2xl border p-5 shadow-sm space-y-1 transition-all ${
            activeFilter === "expired"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400"
              : "bg-white border-stone-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">Already Expired</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{expiredCount}</div>
          <p className="text-[11px] text-rose-800">Past validity date</p>
        </Link>

        {/* Active Members */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500">Active Membership Base</span>
          <div className="text-2xl font-black text-stone-900">
            {allMembers.filter((m) => m.status === "APPROVED").length}
          </div>
          <p className="text-[11px] text-stone-400">Approved club naturalists</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-medium">
        <Link
          href="/admin/payments"
          className={`px-3.5 py-1.5 rounded-xl transition-colors ${
            activeFilter === "all"
              ? "bg-emerald-800 text-white font-semibold"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          All Payments ({totalCount})
        </Link>
        <Link
          href="/admin/payments?filter=expiring_soon"
          className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeFilter === "expiring_soon"
              ? "bg-amber-600 text-white font-semibold"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Expiring Soon ({expiringSoonCount})</span>
        </Link>
        <Link
          href="/admin/payments?filter=expired"
          className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeFilter === "expired"
              ? "bg-rose-700 text-white font-semibold"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Expired ({expiredCount})</span>
        </Link>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">No payment records found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {activeFilter === "expiring_soon"
                ? "Good news! No memberships are expiring within the next 30 days."
                : activeFilter === "expired"
                ? "No expired memberships found."
                : "No dues payments have been recorded yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Validity Period</th>
                  <th className="py-3 px-4">Expiry Status</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Note / Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map((p) => {
                  const expiryInfo = getExpiryStatus(p.expiryDate);

                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* Member */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/members/${p.member.id}`}
                          className="font-bold text-emerald-950 hover:underline block"
                        >
                          {p.member.fullName}
                        </Link>
                        <span className="font-mono text-[11px] text-stone-500">
                          {p.member.memberCode} • {p.member.membershipType?.name || "Standard"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-emerald-800 text-sm">
                        ${p.amount.toFixed(2)}
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-medium text-[11px]">
                          {methodLabels[p.paymentMethod] || p.paymentMethod}
                        </span>
                      </td>

                      {/* Validity Period */}
                      <td className="py-3.5 px-4 text-stone-700">
                        <div className="text-[11px]">
                          <span>{new Date(p.startDate).toLocaleDateString()}</span>
                          <span className="mx-1 text-stone-400">&rarr;</span>
                          <span className="font-semibold text-stone-900">
                            {new Date(p.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Expiry Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${expiryInfo.badgeClass}`}
                        >
                          {expiryInfo.label}
                        </span>
                      </td>

                      {/* Payment Date */}
                      <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>

                      {/* Note & Recorder */}
                      <td className="py-3.5 px-4">
                        {p.note ? (
                          <span className="text-stone-800 block text-[11px] truncate max-w-xs">
                            {p.note}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px] italic">No note</span>
                        )}
                        <span className="text-[10px] text-stone-400">
                          Logged by: {p.recordedBy || "Staff"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
