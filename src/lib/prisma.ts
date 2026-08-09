import { PrismaClient } from "@prisma/client";

/**
 * A single PrismaClient for the whole app.
 *
 * Next.js hot-reloads modules in development, which would otherwise create a
 * new client — and a new connection pool — on every file save until Supabase
 * refuses new connections. Stashing it on `globalThis` survives the reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
