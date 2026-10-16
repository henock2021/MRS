"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users, Loader2, AlertCircle, Check } from "lucide-react";

interface MemberOption {
  id: string;
  memberCode: string;
  fullName: string;
  email: string;
  status: string;
}

interface RegisterMemberModalProps {
  eventId: string;
  eventTitle: string;
  capacity: number;
  currentCount: number;
  availableMembers: MemberOption[];
}

export default function RegisterMemberModal({
  eventId,
  eventTitle,
  capacity,
  currentCount,
  availableMembers,
}: RegisterMemberModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFull = currentCount >= capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedMemberId) {
      setErrorMessage("Please choose a club member.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMemberId }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to register member.");
        }

        setIsOpen(false);
        setSelectedMemberId("");
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
        disabled={isFull}
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-300 text-white font-semibold text-xs shadow-sm transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        <span>{isFull ? "Event at Full Capacity" : "Add Member to Outing"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Register Member for Outing
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate max-w-xs">
                    {eventTitle} ({currentCount} / {capacity} filled)
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
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Select Club Member <span className="text-rose-500">*</span>
                </label>
                {availableMembers.length === 0 ? (
                  <p className="text-xs text-stone-500 py-3 italic">
                    All registered members are already on the roster for this event.
                  </p>
                ) : (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Choose Member --</option>
                    {availableMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.memberCode} - {m.fullName} ({m.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

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
                  disabled={isPending || availableMembers.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-300 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Registration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
