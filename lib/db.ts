import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate());
};

type GlobalThisWithPrisma = {
  prisma?: ReturnType<typeof prismaClientSingleton>;
} & typeof globalThis;

const globalForPrisma = globalThis as GlobalThisWithPrisma;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
