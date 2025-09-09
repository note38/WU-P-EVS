import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
  // Skip Prisma client creation if no database URL is available (build time)
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    return null as any;
  }
  
  try {
    return new PrismaClient().$extends(withAccelerate());
  } catch (error) {
    console.warn('Failed to create Prisma client:', error);
    return null as any;
  }
};

type GlobalThisWithPrisma = {
  prisma?: ReturnType<typeof prismaClientSingleton>;
} & typeof globalThis;

const globalForPrisma = globalThis as GlobalThisWithPrisma;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
