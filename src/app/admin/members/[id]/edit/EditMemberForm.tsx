"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INTEREST_AREAS } from "@/lib/validations";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { MemberStatus } from "@prisma/client";

interface EditMemberFormProps {
  member: any;
  membershipTypes: Array<{ id: string; name: string; fee: number }>;
}

export default function EditMemberForm({ member, membershipTypes }: EditMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(member.fullName);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone);
  const [address, setAddress] = useState(member.address);
  const [occupation, setOccupation] = useState(member.occupation || "");
  const [status, setStatus] = useState<MemberStatus>(member.status);
  const [membershipTypeId, setMembershipTypeId] = useState(member.membershipTypeId || "");
  const [interestAreas, setInterestAreas] = useState<string[]>(
    member.interestAreas ? member.interestAreas.split(",").map((s: string) => s.trim()) : []
  );
  const [emergencyName, setEmergencyName] = useState(member.emergencyContactName);
  const [emergencyPhone, setEmergencyPhone] = useState(member.emergencyContactPhone);
  const [healthNotes, setHealthNotes] = useState(member.healthNotes || "");
  const [adminNotes, setAdminNotes] = useState(member.adminNotes || "");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleInterest = (id: string) => {
    if (interestAreas.includes(id)) {
      if (interestAreas.length > 1) {
        setInterestAreas(interestAreas.filter((i) => i !== id));
      }
    } else {
      setInterestAreas([...interestAreas, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      fullName,
      email,
      phone,
      address,
      occupation,
      status,
      membershipTypeId,
      interestAreas,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      healthNotes,
      adminNotes,
    };

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/members/${member.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update member profile.");
        }

        router.push(`/admin/members/${member.id}`);
        router.refresh();
      } catch (err: any) {
        setErrorMessage(err.message || "An error occurred.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Basic Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Occupation / School</label>
          <input
            type="text"
            required
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Status & Tier Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Membership Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MemberStatus)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Membership Tier</label>
          <select
            value={membershipTypeId}
            onChange={(e) => setMembershipTypeId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {membershipTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (${t.fee}/year)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Interests */}
      <div className="pt-4 border-t border-stone-100 space-y-2">
        <label className="block text-xs font-semibold text-stone-700">Activity Interests</label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_AREAS.map((ia) => {
            const isSelected = interestAreas.includes(ia.id);
            return (
              <button
                type="button"
                key={ia.id}
                onClick={() => toggleInterest(ia.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-stone-700 border-stone-300 hover:border-emerald-300"
                }`}
              >
                {ia.label.split("&")[0].trim()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Emergency & Health Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Emergency Contact Name</label>
          <input
            type="text"
            required
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Emergency Contact Phone</label>
          <input
            type="tel"
            required
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-700 mb-1">Health Notes / Allergies</label>
          <textarea
            rows={2}
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-700 mb-1">Internal Warden Notes / Rejection Reason</label>
          <textarea
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-300 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
