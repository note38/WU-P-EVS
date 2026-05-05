import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('Current Time (UTC):', now.toISOString());

  const elections = await prisma.election.findMany();
  console.log(`Found ${elections.length} elections total.`);

  elections.forEach(e => {
    console.log(`- Election: "${e.name}" (ID: ${e.id})`);
    console.log(`  Status: ${e.status}`);
    console.log(`  Start: ${e.startDate.toISOString()}`);
    console.log(`  End:   ${e.endDate.toISOString()}`);
    
    if (e.status === 'INACTIVE' && now >= e.startDate && now < e.endDate) {
      console.log('  -> SHOULD BE ACTIVE');
    } else if (e.status !== 'COMPLETED' && now >= e.endDate) {
      console.log('  -> SHOULD BE COMPLETED');
    } else {
      console.log('  -> Status is correct');
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
