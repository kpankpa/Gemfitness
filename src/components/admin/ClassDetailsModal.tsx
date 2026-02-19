'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Users,
  UserCheck,
  Dumbbell,
  Star,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    name: string;
    description?: string;
    type: string;
    instructor: string;
    duration: number;
    maxCapacity: number;
    enrolled: number;
    schedule: string;
    color?: string;
    status: string;
    rating?: number;
    waitlistCount?: number;
    totalReviews?: number;
  };
  onManageEnrollments?: () => void;
  onViewAttendance?: () => void;
  onEdit?: () => void;
}

export default function ClassDetailsModal({ 
  isOpen, 
  onClose, 
  classData,
  onManageEnrollments,
  onViewAttendance,
  onEdit
}: ClassDetailsModalProps) {
  if (!isOpen) return null;

  const formatSchedule = (scheduleString: string) => {
    try {
      const date = new Date(scheduleString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return scheduleString;
    }
  };

  const statusColor = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-blue-100 text-blue-700'
  }[classData.status.toUpperCase()] || 'bg-gray-100 text-gray-700';

  const capacityPercentage = Math.round((classData.enrolled / classData.maxCapacity) * 100);
  const spotsRemaining = classData.maxCapacity - classData.enrolled;
  const isFull = spotsRemaining <= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className={`relative h-32 bg-gradient-to-br ${classData.color || 'from-orange-400 to-orange-600'} flex-shrink-0`}>
            <div className="absolute inset-0 flex items-center justify-between p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                  <Dumbbell className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{classData.name}</h2>
                  <p className="text-white text-opacity-90">{classData.type}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}>
                  {classData.status}
                </span>
                {classData.rating !== undefined && classData.rating !== null && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{classData.rating.toFixed(1)}</span>
                    {classData.totalReviews !== undefined && (
                      <span className="text-gray-600 text-sm">({classData.totalReviews} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {classData.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{classData.description}</p>
                </div>
              )}

              {/* Class Details Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <UserCheck className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Instructor</p>
                    <p className="text-gray-600">{classData.instructor}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-gray-600">{classData.duration} minutes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Schedule</p>
                    <p className="text-gray-600 text-sm">{formatSchedule(classData.schedule)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Capacity</p>
                    <p className="text-gray-600">{classData.enrolled} / {classData.maxCapacity} enrolled</p>
                  </div>
                </div>
              </div>

              {/* Enrollment Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Enrollment Status</h3>
                  <span className="text-sm font-medium text-gray-600">{capacityPercentage}% Full</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      isFull ? 'bg-red-500' : capacityPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className={`font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                    {isFull ? 'Class Full' : `${spotsRemaining} spots remaining`}
                  </span>
                  {classData.waitlistCount !== undefined && classData.waitlistCount > 0 && (
                    <span className="text-gray-600">
                      {classData.waitlistCount} on waitlist
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Summary (if available) */}
              {(classData.rating !== undefined || classData.waitlistCount !== undefined) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{capacityPercentage}%</p>
                    <p className="text-sm text-gray-600">Enrollment Rate</p>
                  </div>

                  {classData.rating !== undefined && classData.rating !== null && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2 fill-yellow-500" />
                      <p className="text-2xl font-bold text-gray-900">{classData.rating.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                  )}

                  {classData.waitlistCount !== undefined && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{classData.waitlistCount}</p>
                      <p className="text-sm text-gray-600">Waitlist</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex-shrink-0 border-t bg-gray-50 p-6">
            <div className="flex flex-wrap gap-3">
              {onManageEnrollments && (
                <Button
                  onClick={() => {
                    onManageEnrollments();
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Enrollments
                </Button>
              )}
              {onViewAttendance && (
                <Button
                  onClick={() => {
                    onViewAttendance();
                    onClose();
                  }}
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Attendance
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
                  Edit Class
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                className="ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
