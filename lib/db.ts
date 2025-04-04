import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type GlobalThisWithPrisma = {
  prisma?: ReturnType<typeof prismaClientSingleton>;
} & typeof globalThis;

const globalForPrisma = globalThis as GlobalThisWithPrisma;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
