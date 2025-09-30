const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Try to query the User table structure
    const users = await prisma.$queryRaw`SELECT * FROM "User" LIMIT 0`;
    console.log('User table exists and is accessible');
    
    // Get column information
    const columns = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User'`;
    console.log('User table columns:', columns);
    
  } catch (error) {
    console.error('Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();