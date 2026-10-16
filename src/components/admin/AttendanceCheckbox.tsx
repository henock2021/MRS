"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

interface AttendanceCheckboxProps {
  eventId: string;
  memberId: string;
  initialAttended: boolean;
  memberName: string;
}

export default function AttendanceCheckbox({
  eventId,
  memberId,
  initialAttended,
  memberName,
}: AttendanceCheckboxProps) {
  const [attended, setAttended] = useState(initialAttended);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextState = !attended;
    setAttended(nextState);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}/attendance`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, attended: nextState }),
        });

        if (!res.ok) {
          // Revert state if failed
          setAttended(!nextState);
          const err = await res.json();
          alert(err.error || "Failed to update attendance.");
        }
      } catch (err) {
        setAttended(!nextState);
        alert("Network error updating attendance.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
        attended
          ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm"
          : "bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200"
      }`}
      title={attended ? `Mark ${memberName} as absent` : `Mark ${memberName} as attended`}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <div
          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
            attended ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-400 bg-white"
          }`}
        >
          {attended && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </div>
      )}
      <span>{attended ? "Attended" : "Absent / Not Marked"}</span>
    </button>
  );
}
