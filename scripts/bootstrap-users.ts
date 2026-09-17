import 'dotenv/config';
import { PrismaClient, $Enums } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { generateMemberQRCode } from '../src/lib/qr/generator';

const prisma = new PrismaClient();

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

async function getOrCreateStaff(data: {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  role: $Enums.UserRole;
}): Promise<void> {
  const email = normalizeEmail(data.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ⏭️  ${data.role} already exists: ${email} (${existing.firstName} ${existing.lastName})`);
    return;
  }
  const hashedPassword = await bcrypt.hash(data.password, 12);
  await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role,
      dateOfBirth: new Date('1990-01-01'),
      emergencyContact: 'N/A',
      emergencyPhone: data.phone,
      registrationType: 'ADMIN',
      registrationPaid: true,
      emailVerified: true,
      passwordSet: true,
    },
  });
  console.log(`  ✅ Created ${data.role}: ${email} (password: ${data.password})`);
}

async function getOrCreateMember(data: {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
}): Promise<void> {
  const email = normalizeEmail(data.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ⏭️  MEMBER already exists: ${email} (${existing.firstName} ${existing.lastName})`);
    return;
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const qrCodeResult = await generateMemberQRCode();
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const member = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      phone: data.phone,
      password: hashedPassword,
      role: $Enums.UserRole.MEMBER,
      qrCode: qrCodeResult.token,
      registrationType: 'SELF',
      registrationPaid: true,
      emergencyContact: 'N/A',
      emergencyPhone: data.phone,
      dateOfBirth: new Date('1995-01-01'),
      address: '',
      fitnessGoals: '',
      medicalConditions: '',
      emailVerified: true,
      passwordSet: true,
      parqCompleted: true,
      parqCompletedAt: now,
      parqRiskLevel: 'LOW',
    },
  });

  await prisma.parQResponse.create({
    data: {
      userId: member.id,
      responses: JSON.stringify({
        hasHeartCondition: false,
        hasChestPain: false,
        hasDizziness: false,
        hasJointProblems: false,
        takesMedication: false,
        hasOtherConditions: false,
      }),
      riskLevel: 'LOW',
      completedAt: now,
    },
  });

  const subscription = await prisma.subscription.create({
    data: {
      userId: member.id,
      plan: 'ONE_MONTH',
      status: 'ACTIVE',
      startDate: now,
      endDate,
      amount: 200,
      registrationType: 'SELF',
    },
  });

  const reference = `BOOTSTRAP-${nanoid(10)}`;
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      amount: 200,
      paymentMethod: 'CASH',
      paymentDate: now,
      reference,
      status: 'SUCCESS',
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      userId: member.id,
      reference: `TX-${nanoid(12)}`,
      amount: 200,
      currency: 'GHS',
      status: 'success',
      paymentMethod: 'cash',
      transactionType: 'subscription',
      relatedEntityType: 'subscription',
      relatedEntityId: subscription.id,
      paidAt: now,
    },
  });

  console.log(`  ✅ Created MEMBER: ${email} (password: ${data.password}, plan: ONE_MONTH -> ${endDate.toISOString().split('T')[0]})`);
  console.log(`     QR token: GYM|${qrCodeResult.token}`);
}

async function main() {
  console.log('🌱 Bootstrapping base user accounts...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gemfitness.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminPhone = process.env.ADMIN_PHONE || '+233201234567';

  const memberEmail = process.env.MEMBER_EMAIL || 'member@gemfitness.com';
  const memberPassword = process.env.MEMBER_PASSWORD || 'Member123!';
  const memberPhone = process.env.MEMBER_PHONE || '+233200000002';

  console.log('\n  Admin:');
  await getOrCreateStaff({
    firstName: 'Admin',
    lastName: 'User',
    email: adminEmail,
    phone: adminPhone,
    password: adminPassword,
    role: $Enums.UserRole.ADMIN,
  });

  console.log('\n  Receptionist:');
  await getOrCreateStaff({
    firstName: 'Reception',
    lastName: 'Receptionist',
    email: process.env.RECEPTIONIST_EMAIL || 'receptionist@gemfitness.com',
    phone: process.env.RECEPTIONIST_PHONE || '+233200000003',
    password: process.env.RECEPTIONIST_PASSWORD || 'Receptionist123!',
    role: $Enums.UserRole.RECEPTIONIST,
  });

  console.log('\n  Member:');
  await getOrCreateMember({
    firstName: 'Member',
    lastName: 'One',
    email: memberEmail,
    phone: memberPhone,
    password: memberPassword,
  });

  console.log('\n✨ Bootstrap complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error bootstrapping users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });