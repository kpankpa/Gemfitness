import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listTrainers } from '@/lib/services/scheduling/trainer-service';

export const dynamic = 'force-dynamic';

const FALLBACK_TRAINERS = [
  {
    id: 'fallback-fireman',
    name: 'Instructor Fireman',
    specializations: ['Strength & Conditioning'],
    bio: "The original. The standard. Fireman doesn't coach — he ignites. Every session is a masterclass in what hard work actually looks like.",
    certifications: ['Strength Coach', 'Conditioning Specialist', 'Nutrition'],
    image: '/trainers/instructor_Fireman.jpeg',
    status: 'ACTIVE',
  },
  {
    id: 'fallback-alby',
    name: 'Instructor Alby',
    specializations: ['HIIT & Cardio'],
    bio: "Zero excuses, maximum output. Alby turns your limits into starting points.",
    certifications: ['ACE Certified', 'HIIT Specialist', 'TRX Instructor'],
    image: '/trainers/instructor_Alby.jpeg',
    status: 'ACTIVE',
  },
  {
    id: 'fallback-fred',
    name: 'Instructor Fred',
    specializations: ['Boxing & Combat'],
    bio: 'In the ring or on the floor, Fred is relentless. He builds fighters — mentally and physically.',
    certifications: ['Boxing Coach', 'Combat Conditioning', 'FMS Certified'],
    image: '/trainers/instructor_Fred.jpeg',
    status: 'ACTIVE',
  },
  {
    id: 'fallback-energy',
    name: 'Official Energy',
    specializations: ['Dance & Aerobics'],
    bio: "Can't stop, won't stop. Official Energy doesn't just run classes — she creates moments.",
    certifications: ['Zumba Licensed', 'Aerobics Instructor', 'Group Fitness'],
    image: '/trainers/official_energy.jpeg',
    status: 'ACTIVE',
  },
];

/**
 * GET /api/public/trainers
 * Public list of active trainers for the marketing site.
 */
export async function GET() {
  try {
    type PublicTrainer = {
      id: string;
      name: string;
      specializations: string[];
      bio: string | null;
      certifications: string[];
      image: string | null;
      status: string;
    };

    let trainers: PublicTrainer[] = [];
    try {
      const listed = await listTrainers({ status: 'ACTIVE' });
      trainers = listed.map((t) => ({
        id: t.id,
        name: t.name,
        specializations: t.specializations,
        bio: t.bio,
        certifications: t.certifications,
        image: t.image,
        status: t.status,
      }));
    } catch {
      // Tables may not exist yet before migration — fall back
      trainers = [];
    }

    if (!trainers.length) {
      try {
        await prisma.trainer.count();
      } catch {
        // ignore
      }

      return NextResponse.json({
        success: true,
        trainers: FALLBACK_TRAINERS,
        source: 'fallback',
        total: FALLBACK_TRAINERS.length,
      });
    }

    return NextResponse.json({
      success: true,
      trainers,
      source: 'database',
      total: trainers.length,
    });
  } catch (error) {
    console.error('Public trainers error:', error);
    return NextResponse.json({
      success: true,
      trainers: FALLBACK_TRAINERS,
      source: 'fallback',
      total: FALLBACK_TRAINERS.length,
    });
  }
}
