/* eslint-disable @typescript-eslint/no-require-imports */
// Fix incomplete QR codes for all members
const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

async function fixQRCodes() {
  try {
    console.log('🔧 Fixing QR Codes...\n');
    
    // Find all members with incomplete or missing QR codes
    const members = await prisma.user.findMany({
      where: {
        role: 'MEMBER',
        OR: [
          { qrCode: null },
          { qrCode: { endsWith: '-' } }, // Incomplete QR codes
        ]
      }
    });
    
    console.log(`Found ${members.length} members with incomplete QR codes`);
    
    for (const member of members) {
      const newQrCode = `GYM-${member.id}-${nanoid(10)}`;
      
      await prisma.user.update({
        where: { id: member.id },
        data: { qrCode: newQrCode }
      });
      
      console.log(`✅ Fixed QR for ${member.firstName} ${member.lastName}: ${newQrCode}`);
    }
    
    console.log('\n✅ All QR codes fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixQRCodes();
