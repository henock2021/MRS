"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Plus,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { calculateExpiryDate } from "@/lib/payment-utils";
import { PaymentMethod } from "@prisma/client";

interface MemberOption {
  id: string;
  memberCode: string;
  fullName: string;
  email: string;
  status: string;
  membershipType?: {
    id: string;
    name: string;
    fee: number;
    durationDays: number;
  } | null;
}

interface RecordPaymentModalProps {
  members: MemberOption[];
  preselectedMemberId?: string;
  triggerButtonText?: string;
  triggerButtonClass?: string;
}

export default function RecordPaymentModal({
  members,
  preselectedMemberId,
  triggerButtonText = "Record Payment",
  triggerButtonClass = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-colors",
}: RecordPaymentModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const [selectedMemberId, setSelectedMemberId] = useState(preselectedMemberId || "");
  const [amount, setAmount] = useState<number | string>(35);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When selected member changes, update fee and calculated expiry date
  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }

    const member = members.find((m) => m.id === selectedMemberId);
    if (member && member.membershipType) {
      setAmount(member.membershipType.fee);
      const calculated = calculateExpiryDate(startDate, member.membershipType.durationDays);
      setExpiryDate(calculated.toISOString().split("T")[0]);
    } else {
      const calculated = calculateExpiryDate(startDate, 365);
      setExpiryDate(calculated.toISOString().split("T")[0]);
    }
  }, [selectedMemberId, startDate, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedMemberId) {
      setErrorMessage("Please select a club member.");
      return;
    }

    const payload = {
      memberId: selectedMemberId,
      amount: Number(amount),
      paymentMethod,
      startDate,
      expiryDate,
      note: note || null,
      autoApproveMember: autoApprove,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to record payment.");
        }

        setIsOpen(false);
        setNote("");
        router.refresh();
      } catch (err: any) {
        setErrorMessage(err.message || "An error occurred.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerButtonClass}
      >
        <CreditCard className="w-4 h-4" />
        <span>{triggerButtonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Record Membership Payment
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Log fee collection and set member validity period
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Select Member <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberCode} - {m.fullName} ({m.membershipType?.name || "Standard"}, {m.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount and Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Amount Paid ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="OTHER">Other / Cheque</option>
                  </select>
                </div>
              </div>

              {/* Start Date and Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Payment Note / Reference <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Receipt #1042, M-Pesa ref, or cash handed at trail"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Auto-Approve Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-stone-700">
                    Automatically activate member status to <strong>Approved</strong> upon payment
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-300 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
