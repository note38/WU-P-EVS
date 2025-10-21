"use server";

import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function createBackup() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Forbidden: Admin access required');
    }

    // Fetch all data from the database
    const [
      users,
      elections,
      departments,
      years,
      positions,
      candidates,
      voters,
      votes,
      partylists
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.election.findMany(),
      prisma.department.findMany(),
      prisma.year.findMany(),
      prisma.position.findMany(),
      prisma.candidate.findMany(),
      prisma.voter.findMany(),
      prisma.vote.findMany(),
      prisma.partylist.findMany(),
    ]);

    // Create backup data structure
    const backupData = {
      users,
      elections,
      departments,
      years,
      positions,
      candidates,
      voters,
      votes,
      partylists,
      metadata: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        systemInfo: 'Voting System Backup',
        recordCount: {
          users: users.length,
          elections: elections.length,
          departments: departments.length,
          years: years.length,
          positions: positions.length,
          candidates: candidates.length,
          voters: voters.length,
          votes: votes.length,
          partylists: partylists.length,
        }
      }
    };

    return { success: true, data: backupData };
  } catch (error) {
    console.error('Backup error:', error);
    return { success: false, error: (error as Error).message };
  } finally {
    await prisma.$disconnect();
  }
}

export async function restoreBackup(backupData: any) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Forbidden: Admin access required');
    }

    // Validate backup data structure
    if (!backupData.metadata || !backupData.users || !backupData.elections) {
      throw new Error('Invalid backup data structure');
    }

    // Start a transaction to restore data
    await prisma.$transaction(async (tx) => {
      // Clear existing data (in proper order to avoid foreign key constraints)
      await tx.vote.deleteMany();
      await tx.candidate.deleteMany();
      await tx.position.deleteMany();
      await tx.partylist.deleteMany();
      await tx.voter.deleteMany();
      await tx.election.deleteMany();
      await tx.year.deleteMany();
      await tx.department.deleteMany();
      
      // Delete only voter users, keep admin users
      await tx.user.deleteMany({
        where: { role: 'VOTER' }
      });

      // Restore departments
      if (backupData.departments && backupData.departments.length > 0) {
        await tx.department.createMany({
          data: backupData.departments.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            createdAt: new Date(dept.createdAt),
            updatedAt: new Date(dept.updatedAt),
            image: dept.image || null,
          })),
          skipDuplicates: true,
        });
      }

      // Restore years
      if (backupData.years && backupData.years.length > 0) {
        await tx.year.createMany({
          data: backupData.years.map((year: any) => ({
            id: year.id,
            name: year.name,
            departmentId: year.departmentId,
            createdAt: new Date(year.createdAt),
            updatedAt: new Date(year.updatedAt),
          })),
          skipDuplicates: true,
        });
      }

      // Restore elections
      if (backupData.elections && backupData.elections.length > 0) {
        await tx.election.createMany({
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
      }

      // Restore users (only voter users, keep existing admins)
      if (backupData.users && backupData.users.length > 0) {
        const voterUsers = backupData.users.filter((u: any) => u.role === 'VOTER');
        if (voterUsers.length > 0) {
          await tx.user.createMany({
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
        }
      }

      // Restore partylists
      if (backupData.partylists && backupData.partylists.length > 0) {
        await tx.partylist.createMany({
          data: backupData.partylists.map((partylist: any) => ({
            id: partylist.id,
            name: partylist.name,
            electionId: partylist.electionId,
            createdAt: new Date(partylist.createdAt),
            updatedAt: new Date(partylist.updatedAt),
          })),
          skipDuplicates: true,
        });
      }

      // Restore positions
      if (backupData.positions && backupData.positions.length > 0) {
        await tx.position.createMany({
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
      }

      // Restore candidates
      if (backupData.candidates && backupData.candidates.length > 0) {
        await tx.candidate.createMany({
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
      }

      // Restore voters
      if (backupData.voters && backupData.voters.length > 0) {
        await tx.voter.createMany({
          data: backupData.voters.map((voter: any) => ({
            id: voter.id,
            email: voter.email,
            electionId: voter.electionId || null,
            status: voter.status,
            credentialsSent: voter.credentialsSent || false,
            createdAt: new Date(voter.createdAt),
            updatedAt: new Date(voter.updatedAt),
            avatar: voter.avatar,
            firstName: voter.firstName,
            hashpassword: voter.hashpassword || null,
            lastName: voter.lastName,
            middleName: voter.middleName || null,
            yearId: voter.yearId,
            role: voter.role,
            clerkId: voter.clerkId || null,
          })),
          skipDuplicates: true,
        });
      }

      // Restore votes
      if (backupData.votes && backupData.votes.length > 0) {
        await tx.vote.createMany({
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
      }
    });

    return { success: true, message: 'Data restored successfully' };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: (error as Error).message };
  } finally {
    await prisma.$disconnect();
  }
}