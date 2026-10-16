"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface RemoveParticipantButtonProps {
  eventId: string;
  memberId: string;
  memberName: string;
}

export default function RemoveParticipantButton({
  eventId,
  memberId,
  memberName,
}: RemoveParticipantButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    if (!confirm(`Remove ${memberName} from this event roster?`)) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}/register?memberId=${memberId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to remove participant.");
          return;
        }

        router.refresh();
      } catch (err) {
        alert("Network error.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
      title={`Remove ${memberName} from roster`}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
