import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
  // Skip Prisma client creation if no database URL is available (build time)
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
    console.error("❌ DATABASE_URL is not set in production environment");
    return null as any;
  }

  try {
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set");
      return null as any;
    }

    console.log(
      "✅ Initializing Prisma client with DATABASE_URL:",
      process.env.DATABASE_URL.substring(0, 50) + "..."
    );
    return new PrismaClient().$extends(withAccelerate());
  } catch (error) {
    console.error("❌ Failed to create Prisma client:", error);
    return null as any;
  }
};

type GlobalThisWithPrisma = {
  prisma?: ReturnType<typeof prismaClientSingleton>;
} & typeof globalThis;

const globalForPrisma = globalThis as GlobalThisWithPrisma;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
