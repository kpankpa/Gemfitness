/**
 * Scheduling Conflict Detection Service
 * Detects scheduling conflicts for trainers/instructors
 * 
 * src/lib/services/scheduling/conflict-detector.ts
 */

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

// Time slot interface
export interface TimeSlot {
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
}

// Conflict result interface
export interface SchedulingConflict {
  hasConflict: boolean;
  conflictingClasses: Array<{
    id: string;
    name: string;
    schedule: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  message: string;
}

// Schedule parsing result
export interface ParsedSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
}

/**
 * Parse schedule string into structured data
 * Supports formats:
 * - "Monday, Wednesday, Friday 9:00 AM - 10:00 AM"
 * - "Monday 09:00-10:00"
 * - "Tue, Thu 6:30 PM - 7:30 PM"
 */
export function parseSchedule(schedule: string): ParsedSchedule[] {
  const results: ParsedSchedule[] = [];
  
  // Normalize schedule string
  const normalizedSchedule = schedule.trim();
  
  // Day name mappings (abbreviated and full)
  const dayMap: Record<string, string> = {
    'mon': 'Monday',
    'monday': 'Monday',
    'tue': 'Tuesday',
    'tuesday': 'Tuesday',
    'wed': 'Wednesday',
    'wednesday': 'Wednesday',
    'thu': 'Thursday',
    'thursday': 'Thursday',
    'fri': 'Friday',
    'friday': 'Friday',
    'sat': 'Saturday',
    'saturday': 'Saturday',
    'sun': 'Sunday',
    'sunday': 'Sunday',
  };

  // Extract days from schedule
  const daysPattern = /((?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s*,\s*)?)+/gi;
  const daysMatch = normalizedSchedule.match(daysPattern);
  
  if (!daysMatch) {
    logger.warn('Could not parse days from schedule:', schedule);
    return results;
  }

  // Parse individual days
  const daysString = daysMatch[0].toLowerCase();
  const daysList = daysString.split(/\s*,\s*|\s+/).filter(d => d.length > 0);
  const normalizedDays = daysList
    .map(d => dayMap[d.trim()])
    .filter((d): d is string => d !== undefined);

  // Extract time from schedule
  const timePattern = /(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(?:AM|PM)?/i;
  const ampmPattern = /(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i;
  
  let startTime = '';
  let endTime = '';
  
  const ampmMatch = normalizedSchedule.match(ampmPattern);
  if (ampmMatch) {
    startTime = convertTo24Hour(ampmMatch[1], ampmMatch[2].toUpperCase());
    endTime = convertTo24Hour(ampmMatch[3], ampmMatch[4].toUpperCase());
  } else {
    const timeMatch = normalizedSchedule.match(timePattern);
    if (timeMatch) {
      startTime = normalizeTimeFormat(timeMatch[1]);
      endTime = normalizeTimeFormat(timeMatch[2]);
    }
  }

  if (!startTime || !endTime) {
    logger.warn('Could not parse time from schedule:', schedule);
    return results;
  }

  // Convert times to minutes for comparison
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Create result for each day
  for (const day of normalizedDays) {
    results.push({
      dayOfWeek: day,
      startTime,
      endTime,
      startMinutes,
      endMinutes,
    });
  }

  return results;
}

/**
 * Convert 12-hour time to 24-hour format
 */
function convertTo24Hour(time: string, ampm: string): string {
  const [hoursStr, minutes] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  
  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Normalize time format to HH:MM
 */
function normalizeTimeFormat(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes}`;
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 */
function doTimesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  // Two ranges overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
}

/**
 * Detect scheduling conflicts for an instructor
 */
export async function detectSchedulingConflicts(
  instructor: string,
  newSchedule: string,
  excludeClassId?: string // Exclude when updating existing class
): Promise<SchedulingConflict> {
  try {
    // Parse the new schedule
    const newSlots = parseSchedule(newSchedule);
    
    if (newSlots.length === 0) {
      return {
        hasConflict: false,
        conflictingClasses: [],
        message: 'Could not parse schedule - no conflicts detected',
      };
    }

    // Get all active classes for this instructor
    const existingClasses = await prisma.class.findMany({
      where: {
        instructor: {
          equals: instructor,
          mode: 'insensitive', // Case-insensitive match
        },
        status: 'ACTIVE',
        ...(excludeClassId && { id: { not: excludeClassId } }),
      },
      select: {
        id: true,
        name: true,
        schedule: true,
      },
    });

    const conflicts: SchedulingConflict['conflictingClasses'] = [];

    // Check each existing class for conflicts
    for (const existingClass of existingClasses) {
      const existingSlots = parseSchedule(existingClass.schedule);
      
      for (const newSlot of newSlots) {
        for (const existingSlot of existingSlots) {
          // Check if same day and times overlap
          if (
            newSlot.dayOfWeek === existingSlot.dayOfWeek &&
            doTimesOverlap(
              newSlot.startMinutes,
              newSlot.endMinutes,
              existingSlot.startMinutes,
              existingSlot.endMinutes
            )
          ) {
            // Found a conflict
            conflicts.push({
              id: existingClass.id,
              name: existingClass.name,
              schedule: existingClass.schedule,
              dayOfWeek: existingSlot.dayOfWeek,
              startTime: existingSlot.startTime,
              endTime: existingSlot.endTime,
            });
          }
        }
      }
    }

    // Remove duplicates (same class can conflict on multiple days)
    const uniqueConflicts = conflicts.filter((conflict, index, self) =>
      index === self.findIndex(c => c.id === conflict.id && c.dayOfWeek === conflict.dayOfWeek)
    );

    if (uniqueConflicts.length > 0) {
      const conflictDetails = uniqueConflicts
        .map(c => `"${c.name}" on ${c.dayOfWeek} (${c.startTime}-${c.endTime})`)
        .join(', ');
      
      return {
        hasConflict: true,
        conflictingClasses: uniqueConflicts,
        message: `Scheduling conflict detected: ${instructor} already has: ${conflictDetails}`,
      };
    }

    return {
      hasConflict: false,
      conflictingClasses: [],
      message: 'No scheduling conflicts detected',
    };
  } catch (error) {
    logger.error('Error detecting scheduling conflicts:', error);
    throw error;
  }
}

/**
 * Get all classes for an instructor with their schedules
 */
export async function getInstructorSchedule(instructor: string): Promise<{
  instructor: string;
  classes: Array<{
    id: string;
    name: string;
    schedule: string;
    parsedSchedule: ParsedSchedule[];
    status: string;
  }>;
  totalHoursPerWeek: number;
}> {
  try {
    const classes = await prisma.class.findMany({
      where: {
        instructor: {
          equals: instructor,
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        schedule: true,
        duration: true,
        status: true,
      },
    });

    let totalMinutesPerWeek = 0;
    const classesWithParsed = classes.map(c => {
      const parsedSchedule = parseSchedule(c.schedule);
      // Calculate weekly hours: duration * number of days per week
      totalMinutesPerWeek += c.duration * parsedSchedule.length;
      
      return {
        id: c.id,
        name: c.name,
        schedule: c.schedule,
        parsedSchedule,
        status: c.status,
      };
    });

    return {
      instructor,
      classes: classesWithParsed,
      totalHoursPerWeek: Math.round((totalMinutesPerWeek / 60) * 10) / 10,
    };
  } catch (error) {
    logger.error('Error getting instructor schedule:', error);
    throw error;
  }
}

/**
 * Check instructor availability for a specific time slot
 */
export async function checkInstructorAvailability(
  instructor: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string
): Promise<{
  available: boolean;
  reason?: string;
  existingClass?: {
    id: string;
    name: string;
    schedule: string;
  };
}> {
  try {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    const classes = await prisma.class.findMany({
      where: {
        instructor: {
          equals: instructor,
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        schedule: true,
      },
    });

    for (const classItem of classes) {
      const slots = parseSchedule(classItem.schedule);
      
      for (const slot of slots) {
        if (
          slot.dayOfWeek === dayOfWeek &&
          doTimesOverlap(startMinutes, endMinutes, slot.startMinutes, slot.endMinutes)
        ) {
          return {
            available: false,
            reason: `${instructor} is teaching "${classItem.name}" during this time (${slot.startTime}-${slot.endTime})`,
            existingClass: {
              id: classItem.id,
              name: classItem.name,
              schedule: classItem.schedule,
            },
          };
        }
      }
    }

    return {
      available: true,
    };
  } catch (error) {
    logger.error('Error checking instructor availability:', error);
    throw error;
  }
}
