import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role, MemberStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Retrieves the current authenticated user's session from Auth.js.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Enforces that a user is authenticated.
 * If not authenticated, redirects them to /login with a return URL.
 */
export async function requireAuth(returnUrl?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const destination = returnUrl ? `/login?callbackUrl=${encodeURIComponent(returnUrl)}` : "/login";
    redirect(destination);
  }
  return user;
}

/**
 * Enforces that the authenticated user possesses one of the allowed roles.
 * Checked strictly on the server for all admin and staff pages.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  const userRole = (user as any).role as Role;

  if (!allowedRoles.includes(userRole)) {
    redirect("/login?error=UnauthorizedRole");
  }

  return user;
}

/**
 * Enforces that the caller is either an ADMIN or a STAFF member.
 * Used across the /admin dashboard and operations.
 */
export async function requireStaffOrAdmin() {
  return requireRole([Role.ADMIN, Role.STAFF]);
}

/**
 * Enforces that the caller is an ADMIN.
 * Used for deletion, member CSV export, and settings.
 */
export async function requireAdmin() {
  return requireRole([Role.ADMIN]);
}

/**
 * Enforces that the caller is an APPROVED member accessing the member portal.
 * Queries member record strictly by session.user.id to eliminate IDOR vulnerabilities.
 */
export async function requireMemberSession() {
  const user = await requireAuth("/portal/dashboard");
  const userRole = (user as any).role as Role;

  const member = await prisma.member.findFirst({
    where: { userId: user.id },
    include: {
      membershipType: true,
      payments: {
        orderBy: { paymentDate: "desc" },
      },
      registrations: {
        include: {
          event: true,
        },
        orderBy: { registeredAt: "desc" },
      },
    },
  });

  if (!member) {
    if (userRole === Role.ADMIN || userRole === Role.STAFF) {
      redirect("/admin/dashboard");
    }
    redirect("/login?error=NoMemberProfile");
  }

  if (member.status !== MemberStatus.APPROVED) {
    redirect("/login?error=MembershipNotApproved");
  }

  return { user, member };
}

