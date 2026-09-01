import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: { db: { url: (() => {
      const url = process.env.DATABASE_URL ?? "";
      return url.includes("connection_limit") ? url : `${url}${url.includes("?") ? "&" : "?"}connection_limit=3`;
    })() } },
  });

globalForPrisma.prisma = prisma;
