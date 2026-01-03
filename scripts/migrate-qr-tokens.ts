/*
  Migration script: convert legacy QR strings (starting with GYM-) to new token-only storage.
  Run with: npx tsx scripts/migrate-qr-tokens.ts
*/
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
// import { generateQRCodeBuffer } from '../src/lib/qr/generator'; // not used in this script

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting QR migration...');
  const users = await prisma.user.findMany({ where: { qrCode: { contains: 'GYM-' } } });
  console.log(`Found ${users.length} users with legacy QR values`);

  for (const u of users) {
    try {
      // generate token
      const token = nanoid(24);
      // update user with token (store token only)
      await prisma.user.update({ where: { id: u.id }, data: { qrCode: token } });
      console.log(`Updated user ${u.id} -> GYM|${token}`);
    } catch (err) {
      console.error('Failed to migrate user', u.id, err);
    }
  }

  console.log('Migration complete');
  await prisma.$disconnect();
}

migrate().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
