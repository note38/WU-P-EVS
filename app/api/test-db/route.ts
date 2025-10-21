import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('Test DB API: Testing database connection');
    
    // Test database connection by fetching a simple count
    const userCount = await prisma.user.count();
    const electionCount = await prisma.election.count();
    
    console.log('Test DB API: Database connection successful', { userCount, electionCount });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      userCount,
      electionCount
    });
  } catch (error: any) {
    console.error('Test DB API: Database connection failed', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        message: error.message || 'Unknown error occurred during database test'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    console.log('Test DB API: Prisma client disconnected');
  }
}
