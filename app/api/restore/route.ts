import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    console.log("Restore API: Starting restore process");

    // Check if user is authenticated and is admin
    const { userId } = await auth();
    console.log("Restore API: Auth check", { userId });

    if (!userId) {
      console.error("Restore API: Unauthorized access attempt - no user ID");
      return NextResponse.json(
        { error: "Unauthorized: No user ID found" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    console.log("Restore API: User lookup result", {
      userExists: !!user,
      userId,
    });

    if (!user) {
      console.error("Restore API: User not found in database", { userId });
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN") {
      console.error("Restore API: Forbidden access attempt", {
        userId,
        role: user.role,
      });
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse the backup data from the request body
    let backupData;
    try {
      backupData = await req.json();
      console.log("Restore API: Backup data parsed successfully", {
        metadata: backupData.metadata,
        usersCount: backupData.users?.length,
        electionsCount: backupData.elections?.length,
      });
    } catch (parseError) {
      console.error("Restore API: Invalid JSON in request body", parseError);
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details: (parseError as Error).message,
        },
        { status: 400 }
      );
    }

    // Validate backup data structure
    if (!backupData.metadata) {
      console.error("Restore API: Missing metadata in backup data");
      return NextResponse.json(
        { error: "Invalid backup data structure: Missing metadata" },
        { status: 400 }
      );
    }

    if (!backupData.users) {
      console.error("Restore API: Missing users in backup data");
      return NextResponse.json(
        { error: "Invalid backup data structure: Missing users" },
        { status: 400 }
      );
    }

    if (!backupData.elections) {
      console.error("Restore API: Missing elections in backup data");
      return NextResponse.json(
        { error: "Invalid backup data structure: Missing elections" },
        { status: 400 }
      );
    }

    // Log the structure of the backup data for debugging
    console.log("Restore API: Backup data structure", {
      hasDepartments: !!backupData.departments,
      hasYears: !!backupData.years,
      hasPositions: !!backupData.positions,
      hasCandidates: !!backupData.candidates,
      hasVoters: !!backupData.voters,
      hasVotes: !!backupData.votes,
      hasPartylists: !!backupData.partylists,
      departmentsCount: backupData.departments?.length || 0,
      yearsCount: backupData.years?.length || 0,
      positionsCount: backupData.positions?.length || 0,
      candidatesCount: backupData.candidates?.length || 0,
      votersCount: backupData.voters?.length || 0,
      votesCount: backupData.votes?.length || 0,
      partylistsCount: backupData.partylists?.length || 0,
    });

    console.log("Restore API: Starting restore process");

    // Clear existing data (in proper order to avoid foreign key constraints)
    console.log("Restore API: Clearing existing data");
    await prisma.vote.deleteMany();
    console.log("Restore API: Votes deleted");

    await prisma.candidate.deleteMany();
    console.log("Restore API: Candidates deleted");

    await prisma.position.deleteMany();
    console.log("Restore API: Positions deleted");

    await prisma.partylist.deleteMany();
    console.log("Restore API: Partylists deleted");

    await prisma.voter.deleteMany();
    console.log("Restore API: Voters deleted");

    await prisma.election.deleteMany();
    console.log("Restore API: Elections deleted");

    await prisma.year.deleteMany();
    console.log("Restore API: Years deleted");

    await prisma.department.deleteMany();
    console.log("Restore API: Departments deleted");

    // Delete only voter users, keep admin users
    const deletedVoters = await prisma.user.deleteMany({
      where: { role: "VOTER" },
    });
    console.log("Restore API: Voter users deleted", {
      count: deletedVoters.count,
    });

    // Restore departments
    if (backupData.departments && backupData.departments.length > 0) {
      console.log("Restore API: Restoring departments", {
        count: backupData.departments.length,
      });
      try {
        await prisma.department.createMany({
          data: backupData.departments.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            createdAt: new Date(dept.createdAt),
            updatedAt: new Date(dept.updatedAt),
            image: dept.image || null,
          })),
          skipDuplicates: true,
        });
        console.log("Restore API: Departments restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring departments", error);
        throw new Error(
          `Failed to restore departments: ${(error as Error).message}`
        );
      }
    }

    // Restore years
    if (backupData.years && backupData.years.length > 0) {
      console.log("Restore API: Restoring years", {
        count: backupData.years.length,
      });
      try {
        await prisma.year.createMany({
          data: backupData.years.map((year: any) => ({
            id: year.id,
            name: year.name,
            departmentId: year.departmentId,
            createdAt: new Date(year.createdAt),
            updatedAt: new Date(year.updatedAt),
          })),
          skipDuplicates: true,
        });
        console.log("Restore API: Years restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring years", error);
        throw new Error(`Failed to restore years: ${(error as Error).message}`);
      }
    }

    // Restore elections
    if (backupData.elections && backupData.elections.length > 0) {
      console.log("Restore API: Restoring elections", {
        count: backupData.elections.length,
      });
      try {
        await prisma.election.createMany({
          data: backupData.elections.map((election: any) => ({
            id: election.id,
            name: election.name,
            description: election.description || null,
            startDate: new Date(election.startDate),
            endDate: new Date(election.endDate),
            status: election.status,
            createdAt: new Date(election.createdAt),
            updatedAt: new Date(election.updatedAt),
            createdById: election.createdById,
            hideName: election.hideName || false,
          })),
          skipDuplicates: true,
        });
        console.log("Restore API: Elections restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring elections", error);
        throw new Error(
          `Failed to restore elections: ${(error as Error).message}`
        );
      }
    }

    // Restore partylists
    if (backupData.partylists && backupData.partylists.length > 0) {
      console.log("Restore API: Restoring partylists", {
        count: backupData.partylists.length,
      });
      try {
        await prisma.partylist.createMany({
          data: backupData.partylists.map((partylist: any) => ({
            id: partylist.id,
            name: partylist.name,
            electionId: partylist.electionId,
            createdAt: new Date(partylist.createdAt),
            updatedAt: new Date(partylist.updatedAt),
          })),
          skipDuplicates: true,
        });
        console.log("Restore API: Partylists restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring partylists", error);
        throw new Error(
          `Failed to restore partylists: ${(error as Error).message}`
        );
      }
    }

    // Restore positions
    if (backupData.positions && backupData.positions.length > 0) {
      console.log("Restore API: Restoring positions", {
        count: backupData.positions.length,
      });
      try {
        await prisma.position.createMany({
          data: backupData.positions.map((position: any) => ({
            id: position.id,
            name: position.name,
            maxCandidates: position.maxCandidates,
            electionId: position.electionId,
            createdAt: new Date(position.createdAt),
            updatedAt: new Date(position.updatedAt),
            yearId: position.yearId || null,
          })),
          skipDuplicates: true,
        });
        console.log("Restore API: Positions restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring positions", error);
        throw new Error(
          `Failed to restore positions: ${(error as Error).message}`
        );
      }
    }

    // Restore candidates
    if (backupData.candidates && backupData.candidates.length > 0) {
      console.log("Restore API: Restoring candidates", {
        count: backupData.candidates.length,
      });
      try {
        await prisma.candidate.createMany({
          data: backupData.candidates.map((candidate: any) => ({
            id: candidate.id,
            avatar: candidate.avatar || null,
            name: candidate.name,
            positionId: candidate.positionId,
            partylistId: candidate.partylistId,
            createdAt: new Date(candidate.createdAt),
            updatedAt: new Date(candidate.updatedAt),
            electionId: candidate.electionId,
            yearId: candidate.yearId || null,
          })),
          skipDuplicates: true,
        });
        console.log("Restore API: Candidates restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring candidates", error);
        throw new Error(
          `Failed to restore candidates: ${(error as Error).message}`
        );
      }
    }

    // Restore users (only voter users, keep existing admins)
    if (backupData.users && backupData.users.length > 0) {
      const voterUsers = backupData.users.filter(
        (u: any) => u.role === "VOTER"
      );
      console.log("Restore API: Processing voter users", {
        totalUsers: backupData.users.length,
        voterUsers: voterUsers.length,
      });

      if (voterUsers.length > 0) {
        console.log("Restore API: Restoring voter users", {
          count: voterUsers.length,
        });
        try {
          await prisma.user.createMany({
            data: voterUsers.map((user: any) => ({
              id: user.id,
              avatar: user.avatar || null,
              username: user.username,
              email: user.email,
              password: user.password,
              role: user.role,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
              clerkId: user.clerkId || null,
              position: user.position || null,
            })),
            skipDuplicates: true,
          });
          console.log("Restore API: Voter users restored successfully");
        } catch (error) {
          console.error("Restore API: Error restoring voter users", error);
          throw new Error(
            `Failed to restore voter users: ${(error as Error).message}`
          );
        }
      }
    }

    // Restore voters - Handle null middleName values
    if (backupData.voters && backupData.voters.length > 0) {
      console.log("Restore API: Restoring voters", {
        count: backupData.voters.length,
      });
      try {
        // Process voters one by one to handle null middleName values
        for (const voterData of backupData.voters) {
          try {
            await prisma.voter.create({
              data: {
                id: voterData.id,
                email: voterData.email,
                electionId: voterData.electionId || null,
                status: voterData.status,
                credentialsSent: voterData.credentialsSent || false,
                createdAt: new Date(voterData.createdAt),
                updatedAt: new Date(voterData.updatedAt),
                avatar: voterData.avatar,
                firstName: voterData.firstName,
                hashpassword: voterData.hashpassword || null,
                lastName: voterData.lastName,
                // Handle null middleName by providing an empty string as default
                middleName: voterData.middleName || "",
                yearId: voterData.yearId,
                role: voterData.role,
                clerkId: voterData.clerkId || null,
              },
            });
            console.log(
              `Restore API: Voter ${voterData.id} restored successfully`
            );
          } catch (voterError) {
            console.error(
              `Restore API: Error restoring voter ${voterData.id}`,
              voterError
            );
            throw new Error(
              `Failed to restore voter ${voterData.id}: ${(voterError as Error).message}`
            );
          }
        }
        console.log("Restore API: All voters restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring voters", error);
        throw new Error(
          `Failed to restore voters: ${(error as Error).message}`
        );
      }
    }

    // Restore votes
    if (backupData.votes && backupData.votes.length > 0) {
      console.log("Restore API: Restoring votes", {
        count: backupData.votes.length,
      });
      try {
        await prisma.vote.createMany({
          data: backupData.votes.map((vote: any) => ({
            id: vote.id,
            voterId: vote.voterId,
            candidateId: vote.candidateId,
            positionId: vote.positionId,
            electionId: vote.electionId,
            votedAt: new Date(vote.votedAt),
          })),
          skipDuplicates: true,
        });
        console.log("Restore API: Votes restored successfully");
      } catch (error) {
        console.error("Restore API: Error restoring votes", error);
        throw new Error(`Failed to restore votes: ${(error as Error).message}`);
      }
    }

    console.log("Restore API: Data restored successfully");
    return NextResponse.json({
      success: true,
      message: "Data restored successfully",
    });
  } catch (error: any) {
    console.error("Restore API: Critical error during restore process", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as any).code,
      meta: (error as any).meta,
    });

    // Return a more detailed error response
    return NextResponse.json(
      {
        error: "Failed to restore data",
        message:
          error.message || "Unknown error occurred during restore process",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    console.log("Restore API: Prisma client disconnected");
  }
}
