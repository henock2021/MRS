import { requireMemberSession } from "@/lib/auth-utils";
import { CreditCard, Clock, CheckCircle2, AlertTriangle, ShieldCheck, FileText } from "lucide-react";
import { getExpiryStatus } from "@/lib/payment-utils";

export default async function MemberPaymentsPage() {
  // Strictly loads authenticated member and their own payment history
  const { member } = await requireMemberSession();

  const latestPayment = member.payments.length > 0
    ? member.payments.reduce((latest, current) =>
        new Date(current.expiryDate) > new Date(latest.expiryDate) ? current : latest
      )
    : null;

  const expiryInfo = getExpiryStatus(latestPayment?.expiryDate);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <CreditCard className="w-4 h-4" />
          <span>Membership Standing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Dues & Payment Receipts
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Review your membership expiration date, validity countdown, and official club fee receipts
        </p>
      </div>

      {/* Membership Standing Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
              Current Membership Tier
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900">
                {member.membershipType?.name || "General"} Tier
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ${member.membershipType?.fee || 0} / year
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
              Expiration Status
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${expiryInfo.badgeClass}`}>
              {expiryInfo.label}
            </span>
          </div>
        </div>

        {/* Expiry Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Valid Through
            </span>
            <span className="text-sm font-bold text-stone-900">
              {latestPayment
                ? new Date(latestPayment.expiryDate).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No Active Dues Paid"}
            </span>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Days Remaining
            </span>
            <span className="text-sm font-bold text-emerald-800">
              {expiryInfo.daysRemaining !== null
                ? `${expiryInfo.daysRemaining} calendar days`
                : "N/A"}
            </span>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Member Code
            </span>
            <span className="text-sm font-mono font-bold text-stone-900">
              {member.memberCode}
            </span>
          </div>
        </div>

        {/* Renewal Instructions Note */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">How Dues Renewals Work:</span>
            <p className="leading-relaxed text-emerald-800">
              Club dues directly fund environmental tree saplings, trail maintenance tools, and trip safety equipment.
              Renewals can be paid in cash at club monthly meetups or via bank transfer/mobile money to the treasurer.
              Staff coordinators will record your payment and immediately extend your validity period.
            </p>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h2 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>Payment History & Receipts ({member.payments.length})</span>
          </h2>
          <span className="text-[10px] text-stone-400 font-semibold uppercase">
            Official Club Receipts
          </span>
        </div>

        {member.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] font-bold border-y border-stone-200">
                <tr>
                  <th className="py-3 px-4">Date Paid</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Covered Period</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {member.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-stone-900 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-800 whitespace-nowrap">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 font-semibold text-[10px] text-stone-700 border border-stone-200">
                        {p.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                      {new Date(p.startDate).toLocaleDateString()} –{" "}
                      {new Date(p.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-500">
                      {p.recordedBy || "Staff"}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                      {p.note || "Annual Membership Dues"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-400 space-y-1">
            <p className="font-semibold text-stone-600">No payment receipts on file</p>
            <p>Once your annual dues are recorded by club staff, your receipt will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
