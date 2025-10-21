import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Check if user is authenticated and is admin
    const { userId } = await auth();
    
    console.log('[TEST-BACKUP] API called', { userId });
    
    if (!userId) {
      console.log('[TEST-BACKUP] No user ID found');
      return NextResponse.json({ error: 'Unauthorized: No user ID found' }, { status: 401 });
    }

    return NextResponse.json({ 
      message: 'Test backup API working',
      userId: userId
    });
  } catch (error) {
    console.error('[TEST-BACKUP] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test backup API', message: (error as Error).message }, 
      { status: 500 }
    );
  }
}