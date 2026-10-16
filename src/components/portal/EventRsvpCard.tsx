"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  Compass,
  AlertCircle,
} from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  eventType: string;
  description: string;
  meetingPoint: string;
  dateTime: string | Date;
  capacity: number;
  fee: number;
  registeredCount: number;
  isRegistered: boolean;
}

export default function EventRsvpCard({ event }: { event: EventItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const spotsLeft = event.capacity - event.registeredCount;
  const isFull = spotsLeft <= 0;
  const fillPercentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  const handleRsvp = async (action: "register" | "cancel") => {
    setMessage(null);
    setShowConfirmCancel(false);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/portal/events/${event.id}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage({ text: data.error || "Failed to update reservation.", isError: true });
          return;
        }

        setMessage({ text: data.message, isError: false });
        router.refresh();
      } catch (err) {
        setMessage({ text: "A network error occurred. Please try again.", isError: true });
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between hover:border-emerald-300 transition-all">
      <div className="space-y-4">
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 px-3 py-1 rounded-full bg-emerald-100/80 inline-block">
            {event.eventType}
          </span>

          <div className="flex items-center gap-2">
            {event.fee > 0 ? (
              <span className="text-xs font-bold text-stone-700 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
                ${event.fee.toFixed(2)} Fee
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                Free
              </span>
            )}

            {event.isRegistered && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>You're Going</span>
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-stone-600 line-clamp-3 mt-1.5 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Outing Logistics */}
        <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-stone-800">
              {new Date(event.dateTime).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{event.meetingPoint}</span>
          </div>

          {/* Capacity meter */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {event.registeredCount} / {event.capacity} spots filled
                </span>
              </span>
              <span>
                {isFull ? (
                  <strong className="text-rose-600">Full</strong>
                ) : (
                  <span className="text-emerald-700 font-semibold">{spotsLeft} spots left</span>
                )}
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.isError
                ? "bg-rose-50 border border-rose-200 text-rose-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            }`}
          >
            {message.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{message.text}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-5 mt-4 border-t border-stone-100">
        {event.isRegistered ? (
          <div>
            {showConfirmCancel ? (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <p className="text-[11px] font-medium text-stone-700">
                  Cancel your spot in this outing?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRsvp("cancel")}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    {isPending ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmCancel(false)}
                    className="flex-1 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs"
                  >
                    Keep Spot
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Spot Reserved</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(true)}
                  className="py-2.5 px-3 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-700 text-stone-600 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={isFull || isPending}
            onClick={() => handleRsvp("register")}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reserving spot...</span>
              </>
            ) : isFull ? (
              <span>Outing Full</span>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Reserve My Spot</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
