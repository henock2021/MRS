import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  Edit,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Download,
} from "lucide-react";
import { MemberStatus } from "@prisma/client";
import { calculateAge, INTEREST_AREAS } from "@/lib/validations";
import { requireStaffOrAdmin } from "@/lib/auth-utils";

interface SearchParamsProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    tier?: string;
    interest?: string;
    page?: string;
  }>;
}

const statusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  PENDING: { bg: "bg-amber-100 border-amber-200 text-amber-900", text: "Pending Review", icon: Clock },
  APPROVED: { bg: "bg-emerald-100 border-emerald-200 text-emerald-900", text: "Approved", icon: CheckCircle2 },
  REJECTED: { bg: "bg-rose-100 border-rose-200 text-rose-900", text: "Rejected", icon: XCircle },
  DEACTIVATED: { bg: "bg-stone-200 border-stone-300 text-stone-700", text: "Deactivated", icon: AlertTriangle },
};

export default async function MembersPage({ searchParams }: SearchParamsProps) {
  const currentUser = await requireStaffOrAdmin();
  const isAdmin = (currentUser as any).role === "ADMIN";

  const resolvedParams = searchParams ? await searchParams : {};
  const search = resolvedParams.search?.trim() || "";
  const status = resolvedParams.status?.trim() || "";
  const tier = resolvedParams.tier?.trim() || "";
  const interest = resolvedParams.interest?.trim() || "";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const pageSize = 10;

  // Build Prisma filter query
  const where: any = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { memberCode: { contains: search } },
    ];
  }

  if (status && Object.values(MemberStatus).includes(status as MemberStatus)) {
    where.status = status as MemberStatus;
  }

  if (tier) {
    where.membershipTypeId = tier;
  }

  if (interest) {
    where.interestAreas = { contains: interest };
  }

  // Execute database queries in parallel
  const [totalMembers, members, membershipTypes] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        membershipType: true,
      },
    }),
    prisma.membershipType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(totalMembers / pageSize) || 1;
  const startItem = totalMembers === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalMembers);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Members Roster
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Search, filter, approve, and manage Nature Club membership records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <a
              href={`/api/export/members?search=${encodeURIComponent(
                search
              )}&status=${status}&tier=${tier}&interest=${interest}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-white text-stone-700 font-semibold text-xs shadow-sm transition-colors"
              title="Download CSV filtered to current view"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </a>
          )}

          <Link
            href="/register"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name, ID, email, or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              defaultValue={status}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>

          {/* Membership Tier Filter */}
          <div>
            <select
              name="tier"
              defaultValue={tier}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Tiers</option>
              {membershipTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interest Filter */}
          <div>
            <select
              name="interest"
              defaultValue={interest}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Interests</option>
              {INTEREST_AREAS.map((ia) => (
                <option key={ia.id} value={ia.id}>
                  {ia.label.split("&")[0].trim()}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-5 flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Apply Filters
              </button>
              {(search || status || tier || interest) && (
                <Link
                  href="/admin/members"
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors"
                >
                  Clear Filters
                </Link>
              )}
            </div>

            <span className="text-xs text-stone-500">
              Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of{" "}
              <strong>{totalMembers}</strong> members
            </span>
          </div>
        </form>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">No members found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No member applications match your current search or filter criteria. Try resetting your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Member ID</th>
                  <th className="py-3 px-4">Member Info</th>
                  <th className="py-3 px-4">Tier & Dues</th>
                  <th className="py-3 px-4">Interests</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {members.map((member) => {
                  const statusInfo = statusColors[member.status] || statusColors.PENDING;
                  const StatusIcon = statusInfo.icon;
                  const age = calculateAge(member.dateOfBirth);
                  const interestList = member.interestAreas.split(",").map((s) => s.trim());

                  return (
                    <tr key={member.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* Member ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="hover:underline"
                        >
                          {member.memberCode}
                        </Link>
                      </td>

                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-emerald-300 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {member.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs">
                                {member.fullName}
                              </span>
                              {member.isMinor && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Under 18
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 space-x-2">
                              <span>{member.email}</span>
                              <span>•</span>
                              <span>{member.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-900 block">
                          {member.membershipType?.name || "Standard"}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          ${member.membershipType?.fee || 0} / year
                        </span>
                      </td>

                      {/* Interests */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {interestList.slice(0, 2).map((item) => (
                            <span
                              key={item}
                              className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium"
                            >
                              {item}
                            </span>
                          ))}
                          {interestList.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 text-[10px]">
                              +{interestList.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.text}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/members/${member.id}/edit`}
                            className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-100 border border-stone-200 transition-colors"
                            title="Edit Member"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-500">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/members?page=${currentPage - 1}&search=${encodeURIComponent(
                    search
                  )}&status=${status}&tier=${tier}&interest=${interest}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-medium text-stone-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={`/admin/members?page=${currentPage + 1}&search=${encodeURIComponent(
                    search
                  )}&status=${status}&tier=${tier}&interest=${interest}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-medium text-stone-700"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
