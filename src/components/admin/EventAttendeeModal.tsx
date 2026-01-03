'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Download,
  Mail,
  AlertCircle,
  Users,
  CheckCircle2,
  XCircle,
  QrCode,
  Calendar,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface Attendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  membershipPlan: string;
  isMember: boolean;
  registeredAt: string;
  status: 'registered' | 'attended' | 'cancelled';
  ticketQRCode: string;
  paymentStatus: string;
}

interface EventStats {
  total: number;
  registered: number;
  attended: number;
  cancelled: number;
  members: number;
  nonMembers: number;
  capacity: number | string;
  spotsLeft: number | null;
  revenue: number;
}

interface EventAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: {
    id: string;
    title: string;
    eventDate: string;
    location: string;
    isFree: boolean;
    price: number | null;
  };
  onAttendanceChange?: () => void;
}

export default function EventAttendeeModal({
  isOpen,
  onClose,
  eventData,
  onAttendanceChange
}: EventAttendeeModalProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'attended' | 'cancelled'>('all');
  const [filterType, setFilterType] = useState<'all' | 'members' | 'non-members'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Attendee | null>(null);

  const fetchAttendees = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/events/${eventData.id}/attendees`);
      const data = await response.json();

      if (response.ok) {
        setAttendees(data.attendees || []);
        setFilteredAttendees(data.attendees || []);
        setStats(data.stats || null);
      } else {
        setError(data.error || 'Failed to fetch attendees');
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
      setError('Failed to load attendees');
    } finally {
      setIsLoading(false);
    }
  }, [eventData.id]);

  useEffect(() => {
    if (isOpen) {
      fetchAttendees();
    }
  }, [isOpen, fetchAttendees]);

  useEffect(() => {
    // Apply filters
    let filtered = attendees;

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    // Type filter
    if (filterType === 'members') {
      filtered = filtered.filter((a) => a.isMember);
    } else if (filterType === 'non-members') {
      filtered = filtered.filter((a) => !a.isMember);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          a.phone.includes(query)
      );
    }

    setFilteredAttendees(filtered);
  }, [searchQuery, filterStatus, filterType, attendees]);

  const handleMarkAttended = async (userId: string, userName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'attended' ? 'registered' : 'attended';
    const action = newStatus === 'attended' ? 'mark as attended' : 'unmark attendance';

    if (!confirm(`${action} for ${userName}?`)) return;

    try {
      const response = await fetch(`/api/events/${eventData.id}/attendees`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchAttendees();
        onAttendanceChange?.();
      } else {
        alert(data.error || 'Failed to update attendance');
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
      alert('Failed to update attendance');
    }
  };

  const handleExport = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Member Type',
      'Status',
      'Registered Date',
      'Ticket QR'
    ];
    const rows = attendees.map((a) => [
      a.name,
      a.email,
      a.phone,
      a.isMember ? 'Member' : 'Non-Member',
      a.status,
      new Date(a.registeredAt).toLocaleDateString(),
      a.ticketQRCode
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventData.title}-attendees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{eventData.title}</h2>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(eventData.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {eventData.location}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-blue-100">Total Registered</p>
                  <p className="text-2xl font-bold">{stats.registered}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-blue-100">Attended</p>
                  <p className="text-2xl font-bold">{stats.attended}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-blue-100">Members</p>
                  <p className="text-2xl font-bold">{stats.members}</p>
                </div>
                {!eventData.isFree && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-blue-100">Revenue</p>
                    <p className="text-2xl font-bold">GH₵ {stats.revenue}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'registered' | 'attended' | 'cancelled')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="registered">Registered</option>
                  <option value="attended">Attended</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'members' | 'non-members')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="members">Members Only</option>
                  <option value="non-members">Non-Members Only</option>
                </select>

                <Button variant="outline" size="sm" onClick={handleExport} disabled={attendees.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" disabled={attendees.length === 0}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email All
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 350px)' }}>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading attendees...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchAttendees} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                    ? 'No attendees found'
                    : 'No registrations yet'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Attendees will appear here once they register'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {attendee.profileImage ? (
                        <Image
                          src={attendee.profileImage}
                          alt={attendee.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-blue-600">
                          {attendee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{attendee.name}</h4>
                        {attendee.status === 'attended' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="truncate">{attendee.email}</span>
                        <span className="text-gray-400">•</span>
                        <span>{attendee.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            attendee.isMember
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {attendee.isMember ? 'Member' : 'Non-Member'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            attendee.status === 'attended'
                              ? 'bg-green-100 text-green-800'
                              : attendee.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {attendee.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Registered {new Date(attendee.registeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTicket(attendee)}
                        title="View QR Ticket"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      {attendee.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={
                            attendee.status === 'attended'
                              ? 'text-orange-600 hover:text-orange-700'
                              : 'text-green-600 hover:text-green-700'
                          }
                          onClick={() =>
                            handleMarkAttended(attendee.userId, attendee.name, attendee.status)
                          }
                        >
                          {attendee.status === 'attended' ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Unmark
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Mark Attended
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredAttendees.length} of {attendees.length} attendees
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </motion.div>

        {/* QR Ticket Modal */}
        {selectedTicket && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Event Ticket</h3>
              <div className="text-center mb-4">
                <p className="font-semibold text-gray-900">{selectedTicket.name}</p>
                <p className="text-sm text-gray-600">{eventData.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(eventData.eventDate).toLocaleDateString()}
                </p>
              </div>
              <QRCodeDisplay
                data={selectedTicket.ticketQRCode}
                size={200}
                showDownload={true}
                label={selectedTicket.ticketQRCode}
                className="mb-4"
              />
              <p className="text-xs text-gray-500 text-center mb-4">
                Scan this QR code at the event entrance
              </p>
              <Button onClick={() => setSelectedTicket(null)} className="w-full">
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
