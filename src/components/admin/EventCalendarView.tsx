'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  registered: number;
  maxAttendees?: number;
  isFree: boolean;
  price?: number;
  status: string;
  category?: string;
}

interface CalendarViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

export default function EventCalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Get category color
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      WORKSHOP: 'bg-blue-500',
      COMPETITION: 'bg-red-500',
      SOCIAL: 'bg-green-500',
      TRAINING: 'bg-orange-500',
      WELLNESS: 'bg-purple-500',
      CHARITY: 'bg-pink-500',
      CELEBRATION: 'bg-yellow-500',
      SEMINAR: 'bg-indigo-500',
      OTHER: 'bg-gray-500',
    };
    return colors[category || 'OTHER'] || colors.OTHER;
  };

  const days = getCalendarDays();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-gray-900">{monthYear}</h3>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('month')}
              className={viewMode === 'month' ? 'bg-orange-100 border-orange-500' : ''}
            >
              Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' ? 'bg-orange-100 border-orange-500' : ''}
            >
              Week
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const dayEvents = getEventsForDay(date);
            const today = isToday(date);
            const currentMonth = isCurrentMonth(date);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`
                  min-h-[100px] p-2 border-2 rounded-lg transition-all
                  ${today ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}
                  ${!currentMonth ? 'opacity-50' : ''}
                  hover:border-orange-300 hover:shadow-md
                `}
              >
                {/* Date Number */}
                <div className={`
                  text-sm font-semibold mb-1
                  ${today ? 'text-orange-600' : currentMonth ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {date.getDate()}
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, eventIndex) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: eventIndex * 0.05 }}
                      onClick={() => onEventClick?.(event)}
                      className={`
                        text-xs p-1 rounded cursor-pointer
                        ${getCategoryColor(event.category)} text-white
                        hover:opacity-80 transition-opacity
                      `}
                      title={event.title}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="flex items-center gap-1 text-[10px] opacity-90">
                        <Users className="h-2 w-2" />
                        {event.registered}/{event.maxAttendees || '∞'}
                      </div>
                    </motion.div>
                  ))}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-gray-500 font-medium pl-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { name: 'Workshop', value: 'WORKSHOP' },
          { name: 'Competition', value: 'COMPETITION' },
          { name: 'Social', value: 'SOCIAL' },
          { name: 'Training', value: 'TRAINING' },
          { name: 'Wellness', value: 'WELLNESS' },
          { name: 'Charity', value: 'CHARITY' },
          { name: 'Celebration', value: 'CELEBRATION' },
          { name: 'Seminar', value: 'SEMINAR' },
        ].map(cat => (
          <div key={cat.value} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${getCategoryColor(cat.value)}`}></div>
            <span className="text-xs text-gray-600">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
