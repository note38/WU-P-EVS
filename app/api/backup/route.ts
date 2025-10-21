import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Check if user is authenticated and is admin
    const { userId } = await auth();
    
    if (!userId) {
      console.error('Backup API: Unauthorized access attempt - no user ID');
      return NextResponse.json({ error: 'Unauthorized: No user ID found' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.error('Backup API: User not found in database', { userId });
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('Backup API: Forbidden access attempt', { userId, role: user.role });
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Backup API: Starting backup process for user', { userId });

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

    console.log('Backup API: Data fetched successfully', { 
      userId,
      counts: {
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
    });

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

    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Backup API: Error during backup process', error);
    return NextResponse.json(
      { error: 'Failed to create backup', message: (error as Error).message, stack: (error as Error).stack }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}