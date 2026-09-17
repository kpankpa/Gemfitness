import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Get the first admin user to use as createdBy
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('❌ No admin user found. Please create an admin user first.');
    return;
  }

  console.log(`✅ Found admin user: ${adminUser.email}`);

  // Seed Classes
  console.log('\n📚 Seeding classes...');
  
  const classes = [
    {
      name: 'Early Birds Class',
      description: 'Perfect morning cardio session to start your day energized',
      type: 'Cardio',
      instructor: 'Coach John',
      duration: 60,
      maxCapacity: 20,
      schedule: 'Mon-Fri - 6:30 AM',
      color: 'from-red-500 to-pink-500',
      status: 'ACTIVE' as const,
      createdBy: adminUser.id
    },
    {
      name: 'Boot Camp',
      description: 'High-intensity interval training for maximum results',
      type: 'HIIT',
      instructor: 'Coach Sarah',
      duration: 90,
      maxCapacity: 25,
      schedule: 'Mon-Fri - 5:30 AM',
      color: 'from-orange-500 to-yellow-500',
      status: 'ACTIVE' as const,
      createdBy: adminUser.id
    },
    {
      name: 'DM Class',
      description: 'Dynamic stepboard workout for full body conditioning',
      type: 'Stepboard',
      instructor: 'Coach Mike',
      duration: 120,
      maxCapacity: 20,
      schedule: 'Tue, Thu - 7:00 AM',
      color: 'from-purple-500 to-pink-500',
      status: 'ACTIVE' as const,
      createdBy: adminUser.id
    },
    {
      name: 'Weight Training',
      description: 'Build strength and muscle with guided weightlifting sessions',
      type: 'Strength',
      instructor: 'Coach David',
      duration: 90,
      maxCapacity: 15,
      schedule: 'Mon, Wed, Fri - 7:00 PM',
      color: 'from-orange-500 to-red-500',
      status: 'ACTIVE' as const,
      createdBy: adminUser.id
    }
  ];

  for (const classData of classes) {
    const existingClass = await prisma.class.findFirst({
      where: { name: classData.name }
    });

    if (existingClass) {
      console.log(`  ⏭️  Skipping "${classData.name}" - already exists`);
    } else {
      await prisma.class.create({ data: classData });
      console.log(`  ✅ Created class: ${classData.name}`);
    }
  }

  // Seed Events
  console.log('\n🎉 Seeding events...');

  const events = [
    {
      title: 'New Year Fitness Challenge',
      description: 'Start 2026 strong with our month-long fitness challenge. Win prizes and transform your fitness journey!',
      eventDate: new Date('2026-01-01T08:00:00'),
      endDate: new Date('2026-01-31T18:00:00'),
      location: 'GemFitness Tema',
      maxAttendees: 100,
      isFree: true,
      status: 'UPCOMING' as const,
      createdBy: adminUser.id
    },
    {
      title: 'Nutrition Workshop',
      description: 'Learn about proper nutrition for your fitness goals from certified nutritionists',
      eventDate: new Date('2025-12-15T10:00:00'),
      endDate: new Date('2025-12-15T13:00:00'),
      location: 'Main Hall',
      maxAttendees: 50,
      isFree: false,
      price: 50,
      status: 'UPCOMING' as const,
      createdBy: adminUser.id
    },
    {
      title: 'Member Appreciation Day',
      description: 'Special event for all our valued members. Enjoy free refreshments, games, and special workout sessions!',
      eventDate: new Date('2025-12-31T09:00:00'),
      endDate: new Date('2025-12-31T17:00:00'),
      location: 'GemFitness Tema',
      maxAttendees: null,
      isFree: true,
      status: 'UPCOMING' as const,
      createdBy: adminUser.id
    }
  ];

  for (const eventData of events) {
    const existingEvent = await prisma.event.findFirst({
      where: { title: eventData.title }
    });

    if (existingEvent) {
      console.log(`  ⏭️  Skipping "${eventData.title}" - already exists`);
    } else {
      await prisma.event.create({ data: eventData });
      console.log(`  ✅ Created event: ${eventData.title}`);
    }
  }

  // Seed Plans
  console.log('\n💳 Seeding membership plans...');
  
  const plans = [
    {
      name: 'Monthly Membership',
      slug: 'ONE_MONTH',
      description: 'Perfect for trying out our facilities',
      price: 200,
      duration: 30,
      durationUnit: 'days',
      features: [
        'Full gym access',
        'All group classes',
        'Locker facility',
        'Equipment usage',
      ],
      status: 'ACTIVE' as const,
      isPopular: false,
      isFeatured: false,
      displayOrder: 1,
      createdBy: adminUser.id,
    },
    {
      name: 'Quarterly Membership',
      slug: 'THREE_MONTHS',
      description: 'Best value for committed fitness enthusiasts',
      price: 500,
      duration: 90,
      durationUnit: 'days',
      features: [
        'Everything in Monthly',
        'Priority booking',
        '1 free PT session',
        'Guest pass (1x)',
        'Nutrition guide',
      ],
      status: 'ACTIVE' as const,
      isPopular: true,
      isFeatured: false,
      displayOrder: 2,
      createdBy: adminUser.id,
    },
    {
      name: 'Annual Membership',
      slug: 'ONE_YEAR',
      description: 'Maximum savings for the dedicated athlete',
      price: 2200,
      duration: 365,
      durationUnit: 'days',
      features: [
        'Everything in Quarterly',
        '3 free PT sessions',
        'Nutrition consultation',
        'Guest passes (4x)',
        'Progress tracking',
        'Free merchandise',
      ],
      status: 'ACTIVE' as const,
      isPopular: false,
      isFeatured: true,
      displayOrder: 3,
      createdBy: adminUser.id,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({
      where: { slug: plan.slug }
    });

    if (!existing) {
      await prisma.plan.create({ data: plan });
      console.log(`  ✅ Created plan: ${plan.name}`);
    } else {
      console.log(`  ⊘ Plan already exists: ${plan.name}`);
    }
  }

  console.log('\n✨ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
