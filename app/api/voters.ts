import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

type GlobalThisWithPrisma = {
  prisma?: ReturnType<typeof prismaClientSingleton>;
} & typeof globalThis;

const globalForPrisma = globalThis as GlobalThisWithPrisma;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  try {
    // Fetch voters with selected fields
    const voters = await prisma.voter.findMany({
      select: {
        id: true,
        voterId: true,
        name: true,
        email: true,
        status: true,
        pollingStation: true,
        credentialsSent: true,
        createdAt: true,
        election: {
          select: {
            name: true,
            id: true,
          },
        },
        department: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(voters, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Voter fetch error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch voters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}

// Optional: Add POST method for creating a voter
export async function POST(request: NextRequest) {
  try {
    const voterData = await request.json();

    const newVoter = await prisma.voter.create({
      data: voterData,
    });

    return NextResponse.json(newVoter, {
      status: 201,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Voter creation error:", error);

    return NextResponse.json(
      {
        error: "Unable to create voter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
