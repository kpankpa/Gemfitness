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
  'Morning': { start: 6 * 60, end: 12 * 60 },    // 6:00 AM - 12:00 PM
  'Afternoon': { start: 12 * 60, end: 17 * 60 }, // 12:00 PM - 5:00 PM
  'Evening': { start: 17 * 60, end: 21 * 60 },   // 5:00 PM - 9:00 PM
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

/**
 * Create a new trainer profile
 */
export async function createTrainer(_data: {
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
    // TODO: Uncomment when Trainer model is added to schema
    /*
    const trainer = await prisma.trainer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        specializations: data.specializations || [],
        bio: data.bio,
        image: data.image,
        certifications: data.certifications || [],
        maxWeeklyHours: data.maxWeeklyHours || 40,
        preferredDays: data.preferredDays || [],
        preferredTimes: data.preferredTimes || [],
      },
    });

    logger.info('Trainer created:', { id: trainer.id, name: trainer.name });
    return trainer;
    */
    
    // Temporary placeholder
    logger.warn('Trainer model not yet implemented in schema');
    throw new Error('Trainer model not yet implemented. Please add Trainer and TrainerAvailability models to schema.');
  } catch (error) {
    logger.error('Error creating trainer:', error);
    throw error;
  }
}

/**
 * Update trainer profile
 */
export async function updateTrainer(
  _trainerId: string,
  _data: Partial<Omit<TrainerInfo, 'id' | 'hireDate' | 'currentWeeklyHours'>>
): Promise<TrainerInfo> {
  try {
    // TODO: Uncomment when Trainer model is added to schema
    /*
    const trainer = await prisma.trainer.update({
      where: { id: trainerId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    logger.info('Trainer updated:', { id: trainer.id, name: trainer.name });
    return trainer;
    */
    
    logger.warn('Trainer model not yet implemented in schema');
    throw new Error('Trainer model not yet implemented. Please add Trainer and TrainerAvailability models to schema.');
  } catch (error) {
    logger.error('Error updating trainer:', error);
    throw error;
  }
}

/**
 * Get trainer by ID or name
 */
export async function getTrainer(_identifier: string): Promise<TrainerInfo | null> {
  try {
    // TODO: Uncomment when Trainer model is added to schema
    /*
    // Try by ID first, then by name
    let trainer = await prisma.trainer.findUnique({
      where: { id: identifier },
    });

    if (!trainer) {
      trainer = await prisma.trainer.findUnique({
        where: { name: identifier },
      });
    }

    if (!trainer) return null;

    // Get current weekly hours from classes
    const schedule = await getInstructorSchedule(trainer.name);

    return {
      ...trainer,
      currentWeeklyHours: schedule.totalHoursPerWeek,
    };
    */
    
    logger.warn('Trainer model not yet implemented in schema');
    return null;
  } catch (error) {
    logger.error('Error getting trainer:', error);
    throw error;
  }
}

/**
 * List all trainers
 */
export async function listTrainers(_options?: {
  status?: string;
  specialization?: string;
}): Promise<TrainerInfo[]> {
  try {
    // TODO: Uncomment when Trainer model is added to schema
    /*
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

    // Add current weekly hours for each trainer
    const trainersWithHours = await Promise.all(
      trainers.map(async (trainer: TrainerInfo) => {
        const schedule = await getInstructorSchedule(trainer.name);
        return {
          ...trainer,
          currentWeeklyHours: schedule.totalHoursPerWeek,
        };
      })
    );

    return trainersWithHours;
    */
    
    logger.warn('Trainer model not yet implemented in schema');
    return [];
  } catch (error) {
    logger.error('Error listing trainers:', error);
    throw error;
  }
}

/**
 * Set trainer availability for a specific day
 */
export async function setTrainerAvailability(
  _trainerName: string,
  _availability: TrainerAvailabilitySlot[]
): Promise<void> {
  try {
    // TODO: Uncomment when TrainerAvailability model is added to schema
    /*
    // Use upsert for each slot
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
          notes: slot.notes,
        },
        create: {
          trainerName,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          notes: slot.notes,
        },
      });
    }

    logger.info('Trainer availability updated:', { trainerName, slots: availability.length });
    */
  } catch (error) {
    logger.error('Error setting trainer availability:', error);
    throw error;
  }
}

/**
 * Get trainer availability
 */
export async function getTrainerAvailability(
  _trainerName: string
): Promise<TrainerAvailabilitySlot[]> {
  try {
    // TODO: Uncomment when TrainerAvailability model is added to schema
    logger.warn('TrainerAvailability model not yet implemented in schema');
    return [];
    
    /* COMMENTED OUT UNTIL MODEL IS ADDED
    const availability = await prisma.trainerAvailability.findMany({
      where: { trainerName },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return availability.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      notes: slot.notes || undefined,
    }));
    */
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
    // Get all active trainers
    const trainers = await listTrainers({ status: 'ACTIVE' });
    
    // Parse the schedule
    const parsedSchedule = parseSchedule(criteria.schedule);
    
    if (parsedSchedule.length === 0) {
      return [];
    }

    const suggestions: TrainerSuggestion[] = [];

    for (const trainer of trainers) {
      let score = 50; // Base score
      const reasons: string[] = [];
      const warnings: string[] = [];

      // Check specialization match (up to +30 points)
      if (trainer.specializations.some(s => 
        s.toLowerCase().includes(criteria.classType.toLowerCase()) ||
        criteria.classType.toLowerCase().includes(s.toLowerCase())
      )) {
        score += 30;
        reasons.push(`Specializes in ${criteria.classType}`);
      }

      // Check preferred days match (up to +15 points)
      const scheduleDays = parsedSchedule.map(s => s.dayOfWeek);
      const preferredDaysMatch = scheduleDays.filter(day => 
        trainer.preferredDays.includes(day)
      ).length;
      
      if (preferredDaysMatch > 0) {
        const dayBonus = Math.round((preferredDaysMatch / scheduleDays.length) * 15);
        score += dayBonus;
        reasons.push(`Prefers working on ${trainer.preferredDays.filter(d => scheduleDays.includes(d)).join(', ')}`);
      }

      // Check preferred time match (up to +10 points)
      const scheduleTimes = parsedSchedule.map(s => timeToMinutes(s.startTime));
      const preferredTimesMatch = scheduleTimes.filter(time =>
        trainer.preferredTimes.some(period => isTimeInPeriod(time, period))
      ).length;
      
      if (preferredTimesMatch > 0) {
        const timeBonus = Math.round((preferredTimesMatch / scheduleTimes.length) * 10);
        score += timeBonus;
        reasons.push(`Prefers ${trainer.preferredTimes.join(', ')} schedule`);
      }

      // Check weekly hours capacity (penalty if over limit)
      const weeklyHoursAfter = (trainer.currentWeeklyHours || 0) + 
        (criteria.duration / 60) * parsedSchedule.length;
      
      if (weeklyHoursAfter > trainer.maxWeeklyHours) {
        score -= 20;
        warnings.push(`Would exceed max weekly hours (${trainer.maxWeeklyHours}h limit)`);
      } else if (weeklyHoursAfter > trainer.maxWeeklyHours * 0.9) {
        score -= 10;
        warnings.push(`Nearing max weekly hours (${Math.round(weeklyHoursAfter)}/${trainer.maxWeeklyHours}h)`);
      }

      // Check explicit availability
      const availability = await getTrainerAvailability(trainer.name);
      
      for (const slot of parsedSchedule) {
        const isExplicitlyUnavailable = availability.some(a =>
          a.dayOfWeek === slot.dayOfWeek &&
          !a.isAvailable &&
          timeToMinutes(a.startTime) <= slot.startMinutes &&
          timeToMinutes(a.endTime) >= slot.endMinutes
        );
        
        if (isExplicitlyUnavailable) {
          score -= 30;
          warnings.push(`Marked as unavailable on ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`);
        }
      }

      // Check for existing class conflicts
      const instructorSchedule = await getInstructorSchedule(trainer.name);
      const hasConflict = instructorSchedule.classes.some(existingClass => {
        return existingClass.parsedSchedule.some(existing => 
          parsedSchedule.some(newSlot =>
            existing.dayOfWeek === newSlot.dayOfWeek &&
            existing.startMinutes < newSlot.endMinutes &&
            newSlot.startMinutes < existing.endMinutes
          )
        );
      });
      
      if (hasConflict) {
        score -= 50;
        warnings.push('Has scheduling conflict with existing classes');
      }

      // Normalize score
      score = Math.max(0, Math.min(100, score));

      suggestions.push({
        trainer,
        score,
        reasons,
        warnings,
      });
    }

    // Sort by score (highest first)
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
  _trainerIdentifier: string,
  _dates: string[] // ISO date strings
): Promise<void> {
  try {
    // TODO: Uncomment when Trainer model is added to schema
    logger.warn('Trainer model not yet implemented in schema');
    return;
    
    /* COMMENTED OUT UNTIL MODEL IS ADDED
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
      dates: dates.length 
    });
    */
  } catch (error) {
    logger.error('Error setting unavailable dates:', error);
    throw error;
  }
}

/**
 * Get trainer's classes
 */
export async function getTrainerClasses(trainerName: string): Promise<{
  classes: Array<{
    id: string;
    name: string;
    type: string;
    schedule: string;
    duration: number;
    status: string;
  }>;
  totalHoursPerWeek: number;
}> {
  try {
    const schedule = await getInstructorSchedule(trainerName);
    
    const classes = await prisma.class.findMany({
      where: {
        instructor: {
          equals: trainerName,
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        type: true,
        schedule: true,
        duration: true,
        status: true,
      },
    });

    return {
      classes,
      totalHoursPerWeek: schedule.totalHoursPerWeek,
    };
  } catch (error) {
    logger.error('Error getting trainer classes:', error);
    throw error;
  }
}
