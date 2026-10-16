"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { MemberStatus } from "@prisma/client";

interface MemberActionButtonsProps {
  memberId: string;
  memberCode: string;
  fullName: string;
  currentStatus: MemberStatus;
  isAdmin?: boolean;
}

export default function MemberActionButtons({
  memberId,
  memberCode,
  fullName,
  currentStatus,
  isAdmin = false,
}: MemberActionButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const updateStatus = async (newStatus: MemberStatus, notes?: string) => {
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/members/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, adminNotes: notes }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update member status");
        }

        setShowRejectModal(false);
        router.refresh();
      } catch (err: any) {
        setActionError(err.message || "An error occurred");
      }
    });
  };

  return (
    <div className="space-y-2">
      {actionError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Approve Button (shown if not currently approved) */}
        {currentStatus !== "APPROVED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Are you sure you want to approve member ${fullName} (${memberCode})?`)) {
                updateStatus("APPROVED");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-300 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Approve Member</span>
          </button>
        )}

        {/* Reject Button (shown if pending) */}
        {currentStatus === "PENDING" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowRejectModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:bg-stone-300 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Application</span>
          </button>
        )}

        {/* Deactivate Button (shown if approved) */}
        {currentStatus === "APPROVED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                confirm(
                  `Deactivate membership for ${fullName} (${memberCode})? The member will not be able to join events.`
                )
              ) {
                updateStatus("DEACTIVATED");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Deactivate</span>
          </button>
        )}

        {/* Re-activate (shown if rejected or deactivated) */}
        {(currentStatus === "REJECTED" || currentStatus === "DEACTIVATED") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Re-activate ${fullName} (${memberCode}) as an active member?`)) {
                updateStatus("APPROVED");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Activate</span>
          </button>
        )}

        {/* Delete Member (strictly ADMIN role only) */}
        {isAdmin && (
          <button
            type="button"
            disabled={isPending}
            onClick={async () => {
              if (
                confirm(
                  `PERMANENT ACTION: Are you sure you want to completely delete member ${fullName} (${memberCode})? This will delete all their payments and activity records.`
                )
              ) {
                try {
                  const res = await fetch(`/api/admin/members/${memberId}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    alert(err.error || "Failed to delete member.");
                    return;
                  }
                  router.push("/admin/members");
                  router.refresh();
                } catch {
                  alert("Network error.");
                }
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors"
            title="Permanently Delete Member (Admin Only)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <XCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-stone-900">
                Reject Application: {memberCode}
              </h3>
            </div>

            <p className="text-xs text-stone-600">
              Please enter an optional reason or internal warden note explaining why this application is being rejected.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Rejection Reason / Internal Note
              </label>
              <textarea
                rows={3}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="e.g. Incomplete emergency contact or duplicate identity."
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => updateStatus("REJECTED", rejectionNote)}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
