import { PrismaClient } from "@prisma/client";

// ==============================================================================
// Prisma Client Singleton for Next.js App Router
//
// In Next.js development mode, files get re-compiled on every edit (Hot Reload).
// If we create a new `new PrismaClient()` on every module import, we would quickly
// exhaust database connections and lock SQLite files.
//
// By storing the client instance on the `globalThis` object, we ensure only ONE
// single database connection is shared across all API routes and Server Actions.
// ==============================================================================

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
