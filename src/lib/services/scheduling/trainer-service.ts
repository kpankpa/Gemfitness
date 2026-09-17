/**
 * Trainer Preference Service
 * Manages trainer preferences, availability, and assignments
 *
 * src/lib/services/scheduling/trainer-service.ts
 */

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { parseSchedule, getInstructorSchedule } from './conflict-detector';

// Time period mapping
const TIME_PERIODS: Record<string, { start: number; end: number }> = {
  Morning: { start: 6 * 60, end: 12 * 60 }, // 6:00 AM - 12:00 PM
  Afternoon: { start: 12 * 60, end: 17 * 60 }, // 12:00 PM - 5:00 PM
  Evening: { start: 17 * 60, end: 21 * 60 }, // 5:00 PM - 9:00 PM
};

export interface TrainerInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specializations: string[];
  bio: string | null;
  image: string | null;
  certifications: string[];
  status: string;
  hireDate: Date;
  maxWeeklyHours: number;
  preferredDays: string[];
  preferredTimes: string[];
  currentWeeklyHours?: number;
}

export interface TrainerAvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
}

export interface TrainerSuggestion {
  trainer: TrainerInfo;
  score: number; // 0-100, higher is better match
  reasons: string[];
  warnings: string[];
}

function toTrainerInfo(
  trainer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    specializations: string[];
    bio: string | null;
    image: string | null;
    certifications: string[];
    status: string;
    hireDate: Date;
    maxWeeklyHours: number;
    preferredDays: string[];
    preferredTimes: string[];
  },
  currentWeeklyHours?: number
): TrainerInfo {
  return {
    id: trainer.id,
    name: trainer.name,
    email: trainer.email,
    phone: trainer.phone,
    specializations: trainer.specializations,
    bio: trainer.bio,
    image: trainer.image,
    certifications: trainer.certifications,
    status: trainer.status,
    hireDate: trainer.hireDate,
    maxWeeklyHours: trainer.maxWeeklyHours,
    preferredDays: trainer.preferredDays,
    preferredTimes: trainer.preferredTimes,
    ...(currentWeeklyHours !== undefined ? { currentWeeklyHours } : {}),
  };
}

/**
 * Create a new trainer profile
 */
export async function createTrainer(data: {
  name: string;
  email?: string;
  phone?: string;
  specializations?: string[];
  bio?: string;
  image?: string;
  certifications?: string[];
  maxWeeklyHours?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
}): Promise<TrainerInfo> {
  try {
    const trainer = await prisma.trainer.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        specializations: data.specializations || [],
        bio: data.bio ?? null,
        image: data.image ?? null,
        certifications: data.certifications || [],
        maxWeeklyHours: data.maxWeeklyHours || 40,
        preferredDays: data.preferredDays || [],
        preferredTimes: data.preferredTimes || [],
      },
    });

    logger.info('Trainer created:', { id: trainer.id, name: trainer.name });
    return toTrainerInfo(trainer);
  } catch (error) {
    logger.error('Error creating trainer:', error);
    throw error;
  }
}

/**
 * Update trainer profile
 */
export async function updateTrainer(
  trainerId: string,
  data: Partial<Omit<TrainerInfo, 'id' | 'hireDate' | 'currentWeeklyHours'>>
): Promise<TrainerInfo> {
  try {
    const trainer = await prisma.trainer.update({
      where: { id: trainerId },
      data: {
        ...data,
      },
    });

    logger.info('Trainer updated:', { id: trainer.id, name: trainer.name });
    return toTrainerInfo(trainer);
  } catch (error) {
    logger.error('Error updating trainer:', error);
    throw error;
  }
}

/**
 * Get trainer by ID or name
 */
export async function getTrainer(identifier: string): Promise<TrainerInfo | null> {
  try {
    let trainer = await prisma.trainer.findUnique({
      where: { id: identifier },
    });

    if (!trainer) {
      trainer = await prisma.trainer.findUnique({
        where: { name: identifier },
      });
    }

    if (!trainer) return null;

    const schedule = await getInstructorSchedule(trainer.name);

    return toTrainerInfo(trainer, schedule.totalHoursPerWeek);
  } catch (error) {
    logger.error('Error getting trainer:', error);
    throw error;
  }
}

/**
 * List all trainers
 */
export async function listTrainers(options?: {
  status?: string;
  specialization?: string;
}): Promise<TrainerInfo[]> {
  try {
    const where: Record<string, unknown> = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.specialization) {
      where.specializations = {
        has: options.specialization,
      };
    }

    const trainers = await prisma.trainer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const trainersWithHours = await Promise.all(
      trainers.map(async (trainer) => {
        const schedule = await getInstructorSchedule(trainer.name);
        return toTrainerInfo(trainer, schedule.totalHoursPerWeek);
      })
    );

    return trainersWithHours;
  } catch (error) {
    logger.error('Error listing trainers:', error);
    throw error;
  }
}

/**
 * Set trainer availability for a specific day
 */
export async function setTrainerAvailability(
  trainerName: string,
  availability: TrainerAvailabilitySlot[]
): Promise<void> {
  try {
    for (const slot of availability) {
      await prisma.trainerAvailability.upsert({
        where: {
          trainerName_dayOfWeek_startTime: {
            trainerName,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
          },
        },
        update: {
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          notes: slot.notes ?? null,
        },
        create: {
          trainerName,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          notes: slot.notes ?? null,
        },
      });
    }

    logger.info('Trainer availability updated:', {
      trainerName,
      slots: availability.length,
    });
  } catch (error) {
    logger.error('Error setting trainer availability:', error);
    throw error;
  }
}

/**
 * Get trainer availability
 */
export async function getTrainerAvailability(
  trainerName: string
): Promise<TrainerAvailabilitySlot[]> {
  try {
    const availability = await prisma.trainerAvailability.findMany({
      where: { trainerName },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return availability.map((slot) => {
      const mapped: TrainerAvailabilitySlot = {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable,
      };
      if (slot.notes) {
        mapped.notes = slot.notes;
      }
      return mapped;
    });
  } catch (error) {
    logger.error('Error getting trainer availability:', error);
    throw error;
  }
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if a time falls within a period
 */
function isTimeInPeriod(timeMinutes: number, period: string): boolean {
  const periodRange = TIME_PERIODS[period];
  if (!periodRange) return false;
  return timeMinutes >= periodRange.start && timeMinutes < periodRange.end;
}

/**
 * Suggest best trainer for a class based on preferences
 */
export async function suggestTrainerForClass(criteria: {
  classType: string;
  schedule: string;
  duration: number;
}): Promise<TrainerSuggestion[]> {
  try {
    const trainers = await listTrainers({ status: 'ACTIVE' });

    const parsedSchedule = parseSchedule(criteria.schedule);

    if (parsedSchedule.length === 0) {
      return [];
    }

    const suggestions: TrainerSuggestion[] = [];

    for (const trainer of trainers) {
      let score = 50;
      const reasons: string[] = [];
      const warnings: string[] = [];

      if (
        trainer.specializations.some(
          (s) =>
            s.toLowerCase().includes(criteria.classType.toLowerCase()) ||
            criteria.classType.toLowerCase().includes(s.toLowerCase())
        )
      ) {
        score += 30;
        reasons.push(`Specializes in ${criteria.classType}`);
      }

      const scheduleDays = parsedSchedule.map((s) => s.dayOfWeek);
      const preferredDaysMatch = scheduleDays.filter((day) =>
        trainer.preferredDays.includes(day)
      ).length;

      if (preferredDaysMatch > 0) {
        const dayBonus = Math.round((preferredDaysMatch / scheduleDays.length) * 15);
        score += dayBonus;
        reasons.push(
          `Prefers working on ${trainer.preferredDays.filter((d) => scheduleDays.includes(d)).join(', ')}`
        );
      }

      const scheduleTimes = parsedSchedule.map((s) => timeToMinutes(s.startTime));
      const preferredTimesMatch = scheduleTimes.filter((time) =>
        trainer.preferredTimes.some((period) => isTimeInPeriod(time, period))
      ).length;

      if (preferredTimesMatch > 0) {
        const timeBonus = Math.round((preferredTimesMatch / scheduleTimes.length) * 10);
        score += timeBonus;
        reasons.push(`Prefers ${trainer.preferredTimes.join(', ')} schedule`);
      }

      const weeklyHoursAfter =
        (trainer.currentWeeklyHours || 0) +
        (criteria.duration / 60) * parsedSchedule.length;

      if (weeklyHoursAfter > trainer.maxWeeklyHours) {
        score -= 20;
        warnings.push(
          `Would exceed max weekly hours (${weeklyHoursAfter.toFixed(1)}/${trainer.maxWeeklyHours})`
        );
      } else if (weeklyHoursAfter > trainer.maxWeeklyHours * 0.8) {
        warnings.push('Approaching max weekly hours');
      } else {
        score += 5;
        reasons.push('Has capacity for additional hours');
      }

      if (reasons.length === 0 && warnings.length === 0) {
        reasons.push('Available active trainer');
      }

      suggestions.push({
        trainer,
        score: Math.max(0, Math.min(100, score)),
        reasons,
        warnings,
      });
    }

    suggestions.sort((a, b) => b.score - a.score);

    return suggestions;
  } catch (error) {
    logger.error('Error suggesting trainer:', error);
    throw error;
  }
}

/**
 * Mark dates as unavailable for a trainer
 */
export async function setTrainerUnavailableDates(
  trainerIdentifier: string,
  dates: string[]
): Promise<void> {
  try {
    const trainer = await getTrainer(trainerIdentifier);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    await prisma.trainer.update({
      where: { id: trainer.id },
      data: {
        unavailableDates: dates,
      },
    });

    logger.info('Trainer unavailable dates updated:', {
      trainer: trainer.name,
      dates: dates.length,
    });
  } catch (error) {
    logger.error('Error setting unavailable dates:', error);
    throw error;
  }
}

/**
 * Get classes assigned to a trainer
 */
export async function getTrainerClasses(trainerName: string) {
  try {
    const classes = await prisma.class.findMany({
      where: {
        instructor: {
          equals: trainerName,
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    });

    const schedule = await getInstructorSchedule(trainerName);

    return {
      classes,
      schedule,
    };
  } catch (error) {
    logger.error('Error getting trainer classes:', error);
    throw error;
  }
}
