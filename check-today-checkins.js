import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTodayCheckIns() {
  try {
    console.log('\n📊 Checking Today\'s Check-ins\n');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('Today start:', today.toISOString());
    console.log('Tomorrow start:', tomorrow.toISOString());
    console.log('Current time:', new Date().toISOString());
    console.log('');
    
    // Get all check-ins
    const allCheckIns = await prisma.checkIn.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            qrCode: true
          }
        }
      },
      orderBy: { checkInTime: 'desc' },
      take: 10
    });
    
    console.log(`\n📋 Recent Check-ins (Last 10):\n`);
    allCheckIns.forEach((checkin, i) => {
      console.log(`${i + 1}. ${checkin.user.firstName} ${checkin.user.lastName}`);
      console.log(`   Time: ${checkin.checkInTime.toISOString()}`);
      console.log(`   Local: ${checkin.checkInTime.toLocaleString()}`);
      console.log(`   Method: ${checkin.method}`);
      console.log(`   Checked By: ${checkin.checkedBy}`);
      console.log(`   User Email: ${checkin.user.email}`);
      console.log('');
    });
    
    // Get today's check-ins using the same filter as API
    const todayCheckIns = await prisma.checkIn.findMany({
      where: {
        checkInTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { checkInTime: 'desc' }
    });
    
    console.log(`\n✅ Today's Check-ins (Using API filter): ${todayCheckIns.length}\n`);
    todayCheckIns.forEach((checkin, i) => {
      console.log(`${i + 1}. ${checkin.user.firstName} ${checkin.user.lastName}`);
      console.log(`   Time: ${checkin.checkInTime.toLocaleString()}`);
      console.log(`   Method: ${checkin.method}`);
      console.log(`   Checked By: ${checkin.checkedBy}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodayCheckIns();
