import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const now = new Date();

    // Find elections that need status updates
    const electionsToUpdate = await prisma.election.findMany({
      where: {
        OR: [
          // Elections that should be ACTIVE (current time is between start and end, and status is INACTIVE)
          {
            status: "INACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          // Elections that should be COMPLETED (current time is past end date, and status is ACTIVE)
          {
            status: "ACTIVE",
            endDate: { lte: now },
          },
        ],
      },
    });

    const updatePromises = electionsToUpdate.map(async (election) => {
      let newStatus: "ACTIVE" | "COMPLETED";

      if (
        election.status === "INACTIVE" &&
        now >= election.startDate &&
        now < election.endDate
      ) {
        newStatus = "ACTIVE";
      } else if (election.status === "ACTIVE" && now >= election.endDate) {
        newStatus = "COMPLETED";
      } else {
        return null; // No update needed
      }

      return prisma.election.update({
        where: { id: election.id },
        data: {
          status: newStatus,
          updatedAt: now,
        },
      });
    });

    // Filter out null values and execute updates
    const validUpdates = updatePromises.filter((promise) => promise !== null);
    const updatedElections = await Promise.all(validUpdates);

    return NextResponse.json({
      message: `Updated ${updatedElections.length} election(s)`,
      updatedElections: updatedElections.map((election) => ({
        id: election?.id,
        name: election?.name,
        status: election?.status,
      })),
    });
  } catch (error) {
    console.error("Error in auto status update:", error);
    return NextResponse.json(
      { error: "Failed to update election statuses" },
      { status: 500 }
    );
  }
}

// GET endpoint to check which elections need updates without actually updating them
export async function GET() {
  try {
    const now = new Date();

    const electionsNeedingUpdate = await prisma.election.findMany({
      where: {
        OR: [
          {
            status: "INACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          {
            status: "ACTIVE",
            endDate: { lte: now },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    const statusUpdates = electionsNeedingUpdate.map((election) => {
      let suggestedStatus: "ACTIVE" | "COMPLETED";

      if (
        election.status === "INACTIVE" &&
        now >= election.startDate &&
        now < election.endDate
      ) {
        suggestedStatus = "ACTIVE";
      } else if (election.status === "ACTIVE" && now >= election.endDate) {
        suggestedStatus = "COMPLETED";
      } else {
        suggestedStatus = election.status as "ACTIVE" | "COMPLETED";
      }

      return {
        id: election.id,
        name: election.name,
        currentStatus: election.status,
        suggestedStatus,
        startDate: election.startDate,
        endDate: election.endDate,
      };
    });

    return NextResponse.json({
      electionsNeedingUpdate: statusUpdates,
      count: statusUpdates.length,
    });
  } catch (error) {
    console.error("Error checking election statuses:", error);
    return NextResponse.json(
      { error: "Failed to check election statuses" },
      { status: 500 }
    );
  }
}
