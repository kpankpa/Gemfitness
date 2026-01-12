'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Ticket,
  Clock,
  DollarSign
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: {
    id: string;
    title: string;
    description: string;
    eventDate: string;
    endDate?: string | null;
    location: string;
    image?: string;
    maxAttendees?: number;
    registered: number;
    isFree: boolean;
    price?: number;
    status: string;
  };
  onViewAttendees?: () => void;
  onEdit?: () => void;
}

export default function EventDetailsModal({ 
  isOpen, 
  onClose, 
  eventData,
  onViewAttendees,
  onEdit
}: EventDetailsModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColor = {
    UPCOMING: 'bg-blue-100 text-blue-700',
    ONGOING: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700'
  }[eventData.status.toUpperCase()] || 'bg-gray-100 text-gray-700';

  const capacityPercentage = eventData.maxAttendees 
    ? Math.round((eventData.registered / eventData.maxAttendees) * 100)
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header with Image */}
          <div className="relative h-64 bg-gradient-to-br from-orange-100 to-orange-200 flex-shrink-0">
            {eventData.image ? (
              <Image
                src={eventData.image}
                alt={eventData.title}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="h-24 w-24 text-orange-300" />
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>

            {/* Status Badge */}
            <div className="absolute bottom-4 left-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor} shadow-lg`}>
                {eventData.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Title and Description */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{eventData.title}</h1>
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {eventData.description}
              </p>
            </div>

            {/* Event Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Date & Time */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Event Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(eventData.eventDate)}</p>
                  {eventData.endDate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Ends: {formatDate(eventData.endDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                  <p className="font-semibold text-gray-900">{eventData.location}</p>
                </div>
              </div>

              {/* Registration */}
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Registration</p>
                  <p className="font-semibold text-gray-900">
                    {eventData.registered}{eventData.maxAttendees ? `/${eventData.maxAttendees}` : ''} registered
                  </p>
                  {capacityPercentage !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Capacity</span>
                        <span>{capacityPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            capacityPercentage >= 90 ? 'bg-red-500' : 
                            capacityPercentage >= 75 ? 'bg-orange-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                  {eventData.isFree ? (
                    <Ticket className="h-5 w-5 text-white" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {eventData.isFree ? 'Entry' : 'Price'}
                  </p>
                  <p className="font-semibold text-gray-900 text-xl">
                    {eventData.isFree ? 'Free Entry' : `GH₵ ${eventData.price}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {eventData.status.toUpperCase() === 'UPCOMING' && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="h-5 w-5" />
                  <p className="font-semibold">This event is coming up!</p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Register now to secure your spot{eventData.maxAttendees && ` - only ${eventData.maxAttendees - eventData.registered} spots left`}!
                </p>
              </div>
            )}

            {eventData.status.toUpperCase() === 'CANCELLED' && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
                <p className="font-semibold text-red-800">This event has been cancelled</p>
                <p className="text-sm text-red-700 mt-1">
                  Registered attendees have been notified.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-gray-50 flex flex-wrap gap-3 justify-end">
            {onViewAttendees && (
              <Button
                onClick={() => {
                  onViewAttendees();
                  onClose();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                View Attendees ({eventData.registered})
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                variant="outline"
              >
                Edit Event
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
