import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugElectionStatus() {
  const now = new Date();
  console.log(`🔍 Debugging Election Statuses at ${now.toISOString()}`);

  try {
    const elections = await prisma.election.findMany({
      where: {
        status: { not: 'COMPLETED' }
      }
    });

    console.log(`Found ${elections.length} elections that are not COMPLETED:`);

    for (const election of elections) {
      const startsIn = (election.startDate.getTime() - now.getTime()) / 1000 / 60;
      const endsIn = (election.endDate.getTime() - now.getTime()) / 1000 / 60;

      console.log(`\n- "${election.name}" (ID: ${election.id})`);
      console.log(`  Current Status: ${election.status}`);
      console.log(`  Start Date:     ${election.startDate.toISOString()} (${startsIn > 0 ? `Starts in ${startsIn.toFixed(2)}m` : `Started ${Math.abs(startsIn).toFixed(2)}m ago`})`);
      console.log(`  End Date:       ${election.endDate.toISOString()} (${endsIn > 0 ? `Ends in ${endsIn.toFixed(2)}m` : `Ended ${Math.abs(endsIn).toFixed(2)}m ago`})`);

      // Determine what should happen
      if (election.status === 'INACTIVE' && now >= election.startDate && now < election.endDate) {
        console.log('  👉 SHOULD BE: ACTIVE');
      } else if (now >= election.endDate) {
        console.log('  👉 SHOULD BE: COMPLETED');
      } else {
        console.log('  👉 Status is currently correct.');
      }
    }

    if (elections.length === 0) {
      console.log('No active or inactive elections found.');
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugElectionStatus();
