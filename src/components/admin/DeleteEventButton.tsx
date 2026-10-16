"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteEventButtonProps {
  eventId: string;
  eventTitle: string;
}

export default function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        `PERMANENT ACTION: Are you sure you want to delete the event "${eventTitle}"? This will cancel all member registrations for this outing.`
      )
    )
      return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to delete event.");
          return;
        }

        router.push("/admin/events");
        router.refresh();
      } catch (err) {
        alert("Network error.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors"
      title="Permanently Delete Event (Admin Only)"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
      )}
      <span>Delete Event</span>
    </button>
  );
}
