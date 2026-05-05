import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔌 Testing database connection...');
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Database connected successfully!');
    console.log('📊 Result:', result);
    
    // Also check election count
    const count = await prisma.election.count();
    console.log(`🗳️ Total elections in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('💥 Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
