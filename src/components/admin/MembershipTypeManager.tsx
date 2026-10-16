"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";

interface MembershipTypeItem {
  id: string;
  name: string;
  fee: number;
  durationDays: number;
  description: string | null;
  isActive: boolean;
  _count?: {
    members: number;
  };
}

interface MembershipTypeManagerProps {
  initialTypes: MembershipTypeItem[];
}

export default function MembershipTypeManager({ initialTypes }: MembershipTypeManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [types, setTypes] = useState(initialTypes);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<MembershipTypeItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [fee, setFee] = useState<number | string>(35);
  const [durationDays, setDurationDays] = useState<number | string>(365);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingType(null);
    setName("");
    setFee(35);
    setDurationDays(365);
    setDescription("");
    setIsActive(true);
    setErrorMessage(null);
    setShowModal(true);
  };

  const openEditModal = (t: MembershipTypeItem) => {
    setEditingType(t);
    setName(t.name);
    setFee(t.fee);
    setDurationDays(t.durationDays);
    setDescription(t.description || "");
    setIsActive(t.isActive);
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      name,
      fee: Number(fee),
      durationDays: Number(durationDays),
      description: description || null,
      isActive,
    };

    startTransition(async () => {
      try {
        const url = editingType
          ? `/api/admin/membership-types/${editingType.id}`
          : `/api/admin/membership-types`;
        const method = editingType ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to save tier.");
        }

        setShowModal(false);
        router.refresh();
      } catch (err: any) {
        setErrorMessage(err.message || "An error occurred.");
      }
    });
  };

  const toggleActiveStatus = async (tier: MembershipTypeItem) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/membership-types/${tier.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !tier.isActive }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to toggle status");
          return;
        }
        router.refresh();
      } catch (err) {
        alert("Network error.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-500">
          Configure membership plans, annual fees, and validity durations.
        </p>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Membership Tier</span>
        </button>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {initialTypes.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-2xl border p-5 bg-white shadow-sm flex flex-col justify-between transition-all ${
              tier.isActive ? "border-stone-200" : "border-stone-200 opacity-60 bg-stone-50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-base text-stone-900">{tier.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tier.isActive
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-stone-200 text-stone-600 border border-stone-300"
                  }`}
                >
                  {tier.isActive ? "Active" : "Archived"}
                </span>
              </div>

              <div className="my-3">
                <span className="text-3xl font-black text-emerald-800">${tier.fee}</span>
                <span className="text-xs text-stone-500 ml-1">/ {tier.durationDays} days</span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mb-4 min-h-[36px]">
                {tier.description || "No description provided."}
              </p>

              <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <strong>{tier._count?.members || 0}</strong> members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  {tier.durationDays}d validity
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => openEditModal(tier)}
                className="w-full py-1.5 px-3 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3 h-3 text-stone-500" />
                <span>Edit Tier</span>
              </button>

              <button
                type="button"
                onClick={() => toggleActiveStatus(tier)}
                disabled={isPending}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  tier.isActive
                    ? "text-stone-500 hover:text-rose-700 hover:bg-rose-50"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
                title={tier.isActive ? "Deactivate tier" : "Activate tier"}
              >
                {tier.isActive ? "Archive" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-stone-900">
                  {editingType ? `Edit Tier: ${editingType.name}` : "Create Membership Tier"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                  Tier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Naturalist or Lifetime"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Annual Fee ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Duration (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="365"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tier Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe who qualifies or what perks are included."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-stone-700">
                    Active for public registration
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-300 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingType ? "Save Changes" : "Create Tier"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
