/**
 * Utilities for membership fee calculation and expiry tracking.
 */

export interface ExpiryStatus {
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "UNPAID";
  label: string;
  daysRemaining: number | null;
  badgeClass: string;
}

/**
 * Evaluates whether a membership is active, expiring soon (within 30 days), or expired.
 */
export function getExpiryStatus(expiryDateInput?: Date | string | null): ExpiryStatus {
  if (!expiryDateInput) {
    return {
      status: "UNPAID",
      label: "No Dues Paid",
      daysRemaining: null,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    };
  }

  const expiry = new Date(expiryDateInput);
  const now = new Date();

  // Reset hours to compare calendar days accurately
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

  const diffTime = expiryDay.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "EXPIRED",
      label: `Expired (${Math.abs(diffDays)}d ago)`,
      daysRemaining: diffDays,
      badgeClass: "bg-rose-100 text-rose-900 border-rose-200",
    };
  }

  if (diffDays <= 30) {
    return {
      status: "EXPIRING_SOON",
      label: `Expiring Soon (${diffDays}d left)`,
      daysRemaining: diffDays,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse",
    };
  }

  return {
    status: "ACTIVE",
    label: `Active (${diffDays}d left)`,
    daysRemaining: diffDays,
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
  };
}

/**
 * Calculates an expiry date given a start date and duration in days.
 */
export function calculateExpiryDate(startDate: Date | string, durationDays: number): Date {
  const start = new Date(startDate);
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry;
}
