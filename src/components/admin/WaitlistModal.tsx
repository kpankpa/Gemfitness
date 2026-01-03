'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, AlertCircle, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WaitlistMember {
  id: string;
  position: number;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage?: string;
  };
}

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    name: string;
    instructor: string;
    schedule: string;
    maxCapacity: number;
    enrolled: number;
  };
}

export default function WaitlistModal({
  isOpen,
  onClose,
  classData,
}: WaitlistModalProps) {
  const [waitlist, setWaitlist] = useState<WaitlistMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWaitlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classData.id]);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/classes/${classData.id}/waitlist`);
      const data = await response.json();

      if (data.success) {
        setWaitlist(data.waitlist);
      }
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyNext = async () => {
    try {
      setNotifying(true);
      const response = await fetch(
        `/api/classes/${classData.id}/waitlist/notify`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(
          `Notification sent to ${data.notified.user.name}! They have 24 hours to claim their spot.`
        );
        fetchWaitlist(); // Refresh
      } else {
        alert(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error notifying waitlist:', error);
      alert('Failed to send notification');
    } finally {
      setNotifying(false);
    }
  };

  if (!isOpen) return null;

  const availableSpots = classData.maxCapacity - classData.enrolled;
  const canNotify = availableSpots > 0 && waitlist.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Class Waitlist</h2>
                  <p className="text-white/90">{classData.name}</p>
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

          {/* Stats */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classData.enrolled}/{classData.maxCapacity}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Available Spots</p>
                <p className="text-2xl font-bold text-green-600">
                  {availableSpots}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">On Waitlist</p>
                <p className="text-2xl font-bold text-orange-600">
                  {waitlist.length}
                </p>
              </div>
            </div>

            {canNotify && (
              <div className="mt-4 flex items-center gap-3 bg-orange-100 border border-orange-200 rounded-lg p-4">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800 flex-1">
                  {availableSpots} {availableSpots === 1 ? 'spot' : 'spots'}{' '}
                  available! Click below to notify the next person.
                </p>
                <Button
                  onClick={handleNotifyNext}
                  disabled={notifying}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0"
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {notifying ? 'Notifying...' : 'Notify Next'}
                </Button>
              </div>
            )}
          </div>

          {/* Waitlist */}
          <div className="p-6 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading waitlist...</p>
              </div>
            ) : waitlist.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No one on waitlist</p>
                <p className="text-gray-500 text-sm mt-1">
                  The waitlist is currently empty
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitlist.map((member) => (
                  <Card
                    key={member.id}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      {/* Position Badge */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            member.position === 1
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                              : member.position === 2
                              ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                              : member.position === 3
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                              : 'bg-gradient-to-br from-gray-500 to-gray-700'
                          }`}
                        >
                          #{member.position}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          {member.status === 'notified' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              <Mail className="h-3 w-3" />
                              Notified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {member.user.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.user.phone}
                        </p>
                      </div>

                      {/* Joined Date */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <p className="text-sm">
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(member.joinedAt).toLocaleTimeString([], {
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

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Members are notified via email and have
                24 hours to claim their spot.
              </p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
