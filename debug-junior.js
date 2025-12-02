import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugJunior() {
  try {
    console.log('\n🔍 Searching for Junior in database...\n');
    
    // Find Junior by email
    const junior = await prisma.user.findUnique({
      where: { email: 'junior@gmail.com' },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!junior) {
      console.log('❌ Junior not found in database!');
      return;
    }
    
    console.log('✅ Found Junior:');
    console.log('-------------------');
    console.log('ID:', junior.id);
    console.log('Name:', `${junior.firstName} ${junior.lastName}`);
    console.log('Email:', junior.email);
    console.log('Phone:', junior.phone);
    console.log('Role:', junior.role);
    console.log('QR Code:', junior.qrCode);
    console.log('Registration Paid:', junior.registrationPaid);
    console.log('Registration Type:', junior.registrationType);
    console.log('\nSubscriptions:', junior.subscriptions.length);
    
    if (junior.subscriptions.length > 0) {
      junior.subscriptions.forEach((sub, i) => {
        console.log(`\nSubscription ${i + 1}:`);
        console.log('  Plan:', sub.plan);
        console.log('  Status:', sub.status);
        console.log('  Start:', sub.startDate.toISOString());
        console.log('  End:', sub.endDate.toISOString());
        console.log('  Is Active?', sub.status === 'ACTIVE' && sub.endDate >= new Date());
      });
    } else {
      console.log('⚠️  No subscriptions found!');
    }
    
    // Now test the same query the API uses
    console.log('\n\n🔍 Testing API query (role: MEMBER)...\n');
    
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    console.log(`Found ${members.length} members with role='MEMBER':`);
    members.forEach(m => {
      console.log(`  - ${m.firstName} ${m.lastName} (${m.email}) - Role: ${m.role}`);
    });
    
    if (members.length === 0) {
      console.log('\n❌ NO MEMBERS FOUND! This is why Junior doesn\'t appear in search.');
      console.log('   Junior\'s role is:', junior.role);
      console.log('   Expected role: MEMBER');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugJunior();
