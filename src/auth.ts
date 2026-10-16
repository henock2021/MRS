import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "nature-club-fallback-secret-key-32chars",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days session
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        // 1. Rate-limiting check
        const rateCheck = checkRateLimit(email);
        if (!rateCheck.allowed) {
          throw new Error("RATE_LIMITED");
        }

        // 2. Fetch user from SQLite
        const user = await prisma.user.findUnique({
          where: { email },
          include: { member: { select: { id: true, memberCode: true, status: true } } },
        });

        if (!user) {
          recordFailedAttempt(email);
          return null; // Generic error in NextAuth
        }

        // 3. Verify bcrypt password
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          recordFailedAttempt(email);
          return null;
        }

        // 4. Verify member approval status for MEMBER role
        if (user.role === "MEMBER") {
          if (!user.member || user.member.status !== "APPROVED") {
            throw new Error("MEMBER_NOT_APPROVED");
          }
        }

        // 5. Successful login: clear rate limit
        resetRateLimit(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name || "User",
          role: user.role,
          memberId: user.member?.id || null,
          memberCode: user.member?.memberCode || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
        token.memberId = (user as any).memberId;
        token.memberCode = (user as any).memberCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).memberId = token.memberId;
        (session.user as any).memberCode = token.memberCode;
      }
      return session;
    },
  },
});
