// Quick database status check
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...\n');
    
    // Check members
    const memberCount = await prisma.user.count({ where: { role: 'MEMBER' } });
    console.log(`👥 Total Members: ${memberCount}`);
    
    // Check active subscriptions
    const activeSubsCount = await prisma.subscription.count({
      where: { 
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    });
    console.log(`✅ Active Subscriptions: ${activeSubsCount}`);
    
    // Check today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInCount = await prisma.checkIn.count({
      where: { checkInTime: { gte: today } }
    });
    console.log(`📋 Today's Check-ins: ${checkInCount}`);
    
    // Get sample member with active subscription
    if (memberCount > 0) {
      const sampleMember = await prisma.user.findFirst({
        where: { role: 'MEMBER' },
        include: {
          subscriptions: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() }
            },
            take: 1
          }
        }
      });
      
      if (sampleMember) {
        console.log('\n📝 Sample Member:');
        console.log(`   Name: ${sampleMember.firstName} ${sampleMember.lastName}`);
        console.log(`   Email: ${sampleMember.email}`);
        console.log(`   QR Code: ${sampleMember.qrCode}`);
        console.log(`   Has Active Subscription: ${sampleMember.subscriptions.length > 0 ? 'Yes' : 'No'}`);
      }
    }
    
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
