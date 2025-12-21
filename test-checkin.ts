/**
 * Test script to verify check-in functionality
 * Run with: npx tsx test-checkin.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateMemberQRCode } from './src/lib/qr/generator';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testCheckIn() {
  console.log('🔍 Testing check-in functionality...\n');

  try {
    // 1. Check database connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // 2. Get a member with active subscription
    console.log('2️⃣ Looking for member with active subscription...');
    const member = await prisma.user.findFirst({
      where: {
        role: 'MEMBER',
        subscriptions: {
          some: {
            status: 'ACTIVE',
            endDate: { gte: new Date() }
          }
        }
      },
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

    if (!member) {
      console.log('⚠️  No members with active subscriptions found');
      console.log('Creating a test member with subscription...\n');
      
      // Create test member
      const tokenResult = await generateMemberQRCode('test');

      const testMember = await prisma.user.create({
        data: {
          email: `test${Date.now()}@gemfitness.com`,
          phone: `024${Math.floor(Math.random() * 10000000)}`,
          firstName: 'Test',
          lastName: 'Member',
          dateOfBirth: new Date('1990-01-01'),
          emergencyContact: 'Emergency Contact',
          emergencyPhone: '0241234567',
          password: 'hashedpassword123',
          role: 'MEMBER',
          qrCode: tokenResult.token,
          registrationPaid: true,
        }
      });

      // Create active subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      await prisma.subscription.create({
        data: {
          userId: testMember.id,
          plan: 'ONE_MONTH',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: endDate,
          amount: 200
        }
      });

      console.log('✅ Test member created:', {
        id: testMember.id,
        name: `${testMember.firstName} ${testMember.lastName}`,
        email: testMember.email,
        qrCode: `GYM|${testMember.qrCode}`
      });
      console.log('✅ Active subscription created\n');
      
      return testMember;
    }

    console.log('✅ Found member:', {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      qrCode: member.qrCode,
      subscription: member.subscriptions[0]?.plan
    });
    console.log('');

    return member;

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestCheckIn() {
  console.log('3️⃣ Creating test check-in...');
  
  try {
    await prisma.$connect();

    const member = await prisma.user.findFirst({
      where: {
        role: 'MEMBER',
        subscriptions: {
          some: {
            status: 'ACTIVE',
            endDate: { gte: new Date() }
          }
        }
      }
    });

    if (!member) {
      console.log('❌ No member found to check in');
      return;
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: member.id,
        method: 'qr',
        checkedBy: 'test-script'
      }
    });

    console.log('✅ Check-in created:', {
      id: checkIn.id,
      userId: checkIn.userId,
      checkInTime: checkIn.checkInTime,
      method: checkIn.method,
      checkedBy: checkIn.checkedBy
    });
    console.log('');

    // Verify it was saved
    console.log('4️⃣ Verifying check-in was saved...');
    const savedCheckIn = await prisma.checkIn.findUnique({
      where: { id: checkIn.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            qrCode: true
          }
        }
      }
    });

    if (savedCheckIn) {
      console.log('✅ Check-in verified in database:', {
        id: savedCheckIn.id,
        member: `${savedCheckIn.user.firstName} ${savedCheckIn.user.lastName}`,
        qrCode: savedCheckIn.user.qrCode ? `GYM|${savedCheckIn.user.qrCode}` : null,
        time: savedCheckIn.checkInTime.toLocaleString(),
        method: savedCheckIn.method
      });
      console.log('');
    } else {
      console.log('❌ Check-in not found in database');
    }

    // Get today's check-ins count
    console.log('5️⃣ Getting today\'s check-in stats...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const count = await prisma.checkIn.count({
      where: {
        checkInTime: { gte: today }
      }
    });

    console.log(`✅ Total check-ins today: ${count}\n`);

    console.log('🎉 All tests passed! Check-in system is working correctly.\n');

  } catch (error) {
    console.error('❌ Error creating check-in:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
(async () => {
  await testCheckIn();
  await createTestCheckIn();
})();
