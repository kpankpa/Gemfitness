'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ClassBooking {
  id: string;
  class: {
    id: string;
    name: string;
    type: string;
    instructor: string;
    duration: number;
    schedule: string;
  };
  bookedFor: string;
  status: string;
  createdAt: string;
}

interface FavoriteClass {
  class: {
    id: string;
    name: string;
    type: string;
    instructor: string;
  };
  attendedCount: number;
}

interface MemberClassHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberData: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
}

export default function MemberClassHistoryModal({
  isOpen,
  onClose,
  memberData,
}: MemberClassHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any>(null);
  const [filter, setFilter] = useState('all'); // all, attended, cancelled, confirmed

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, memberData.id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/members/${memberData.id}/class-history`
      );
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching class history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredBookings = history?.bookings?.filter((booking: ClassBooking) =>
    filter === 'all' ? true : booking.status === filter
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Class History</h2>
                  <p className="text-white/90">{memberData.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading history...</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {history?.totalBookings || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {history?.attendedCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">Attended</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">
                      {history?.confirmedCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">Upcoming</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">
                      {history?.cancelledCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {history?.attendanceRate || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Attendance</p>
                  </div>
                </div>
              </div>

              {/* Favorite Classes */}
              {history?.favoriteClasses && history.favoriteClasses.length > 0 && (
                <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Favorite Classes
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {history.favoriteClasses.map((fav: FavoriteClass) => (
                      <div
                        key={fav.class.id}
                        className="bg-white rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-purple-400 to-pink-400 p-2 rounded-lg">
                            <Dumbbell className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {fav.class.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {fav.attendedCount} times
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All ({history?.totalBookings || 0})
                  </Button>
                  <Button
                    variant={filter === 'attended' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('attended')}
                    className={
                      filter === 'attended' ? 'bg-green-600 hover:bg-green-700' : ''
                    }
                  >
                    Attended ({history?.attendedCount || 0})
                  </Button>
                  <Button
                    variant={filter === 'confirmed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('confirmed')}
                    className={
                      filter === 'confirmed'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : ''
                    }
                  >
                    Upcoming ({history?.confirmedCount || 0})
                  </Button>
                  <Button
                    variant={filter === 'cancelled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('cancelled')}
                    className={
                      filter === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''
                    }
                  >
                    Cancelled ({history?.cancelledCount || 0})
                  </Button>
                </div>
              </div>

              {/* Bookings List */}
              <div className="p-6 overflow-y-auto max-h-[400px]">
                {filteredBookings && filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      No {filter !== 'all' ? filter : ''} bookings found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings?.map((booking: ClassBooking) => (
                      <Card
                        key={booking.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {booking.status === 'attended' ? (
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                            ) : booking.status === 'cancelled' ? (
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-red-600" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-orange-600" />
                              </div>
                            )}
                          </div>

                          {/* Class Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">
                              {booking.class.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.class.type} • {booking.class.instructor}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.class.duration} mins •{' '}
                              {booking.class.schedule}
                            </p>
                          </div>

                          {/* Date */}
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(booking.bookedFor).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(booking.bookedFor).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t flex items-center justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
