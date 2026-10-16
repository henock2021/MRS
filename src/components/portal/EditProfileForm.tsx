"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  HeartHandshake,
  FileHeart,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  IdCard,
  ShieldCheck,
} from "lucide-react";

interface MemberData {
  id: string;
  memberCode: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string | Date;
  gender: string | null;
  occupation: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  healthNotes: string | null;
  membershipTypeName?: string;
  status: string;
}

export default function EditProfileForm({ member }: { member: MemberData }) {
  const router = useRouter();

  const [phone, setPhone] = useState(member.phone);
  const [address, setAddress] = useState(member.address);
  const [emergencyContactName, setEmergencyContactName] = useState(member.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(member.emergencyContactPhone);
  const [healthNotes, setHealthNotes] = useState(member.healthNotes || "");

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/portal/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            address,
            emergencyContactName,
            emergencyContactPhone,
            healthNotes,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || "Failed to update profile.");
          return;
        }

        setSuccessMessage("Your profile information has been saved successfully.");
        router.refresh();
      } catch (err) {
        setErrorMessage("A network error occurred. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert Feedback */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Official Membership Info (Read-only) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-900">Official Membership Record</h2>
          </div>
          <span className="text-[10px] text-stone-400 font-semibold uppercase">
            Managed by Club Staff
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
              Member ID
            </span>
            <span className="font-mono font-extrabold text-stone-900 text-sm">
              {member.memberCode}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
              Full Legal Name
            </span>
            <span className="font-bold text-stone-900 text-sm">{member.fullName}</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
              Registered Email
            </span>
            <span className="font-medium text-stone-800">{member.email}</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
              Membership Tier
            </span>
            <span className="font-bold text-emerald-800">
              {member.membershipTypeName || "General"}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
              Date of Birth
            </span>
            <span className="font-medium text-stone-800">
              {new Date(member.dateOfBirth).toLocaleDateString()}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
              Status
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{member.status}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Contact Information (Editable) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-900">Your Contact Details</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Keep your phone and address up-to-date for club announcements and field safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Field Safety & Emergency Contact (Editable) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-bold text-stone-900">
              Trip Safety & Emergency Information
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Used by trip leaders during wilderness hikes, clean-ups, and camps in case of medical urgency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Emergency Contact Name & Relationship <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="e.g. David Greenwood (Spouse)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Emergency Contact Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="e.g. +1 555-0102"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <FileHeart className="w-4 h-4 text-stone-500" />
              <span>Health Notes, Allergies, or Special Care Needs (Optional)</span>
            </label>
            <textarea
              rows={3}
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              placeholder="e.g. Bee sting allergy (carries EpiPen), asthma, dietary requirements for camping trips..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Protected data: visible only to certified outdoor leaders during events.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-300 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
