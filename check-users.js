/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('📊 Total users:', users.length);
    console.log('\n👥 All users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    const memberCount = await prisma.user.count({ where: { role: 'MEMBER' } });
    console.log('\n📈 Members with role="MEMBER":', memberCount);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
