"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  User,
  Key,
  Shield,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "STAFF" | "MEMBER";
  createdAt: string | Date;
  member?: {
    memberCode: string;
    fullName: string;
  } | null;
}

interface StaffManagerProps {
  initialUsers: UserItem[];
  currentUserId: string;
}

export default function StaffManager({ initialUsers, currentUserId }: StaffManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create staff account");
        }

        setShowModal(false);
        setName("");
        setEmail("");
        setPassword("");
        router.refresh();
      } catch (err: any) {
        setErrorMessage(err.message || "An error occurred");
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "STAFF") => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/staff/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to update role");
          return;
        }

        router.refresh();
      } catch (err) {
        alert("Network error.");
      }
    });
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the user account for ${userEmail}?`)) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/staff/${userId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to delete user");
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
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-stone-500">
          Manage system users, administrators, and volunteer coordinator accounts.
        </p>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role & Permissions</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {initialUsers.map((u) => {
                const isSelf = u.id === currentUserId;

                return (
                  <tr key={u.id} className="hover:bg-emerald-50/20 transition-colors">
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900">{u.name || "User"}</span>
                            {isSelf && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                                You
                              </span>
                            )}
                          </div>
                          {u.member && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              Member: {u.member.memberCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono text-stone-700">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        disabled={isSelf || isPending}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as "ADMIN" | "STAFF")
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors ${
                          u.role === "ADMIN"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : u.role === "STAFF"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : "bg-stone-100 text-stone-700 border-stone-200"
                        }`}
                      >
                        <option value="ADMIN">ADMIN (Full Access)</option>
                        <option value="STAFF">STAFF (Coordinator)</option>
                      </select>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-stone-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {!isSelf && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(u.id, u.email)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Create Staff Account
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Grant administrative or coordinator access to team members
                  </p>
                </div>
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordinator@natureclub.org"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Initial Password <span className="text-rose-500">* (minimum 8 chars)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Assigned Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="STAFF">STAFF (Volunteer Coordinator - No deletion, no full export)</option>
                  <option value="ADMIN">ADMIN (Full Access - Deletion, user management, export)</option>
                </select>
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
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
