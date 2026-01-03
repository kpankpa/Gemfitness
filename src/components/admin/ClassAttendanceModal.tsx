'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface AttendanceRecord {
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  enrolledAt: string;
  status: 'ATTENDED' | 'ENROLLED' | 'ABSENT';
  checkInTime: string | null;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    name: string;
    instructor: string;
    schedule: string;
    duration: number;
  };
}

export default function ClassAttendanceModal({ isOpen, onClose, classData }: AttendanceModalProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'attended' | 'absent'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalEnrolled: 0,
    attended: 0,
    absent: 0,
    attendanceRate: 0
  });

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/classes/${classData.id}/attendance`);
      const data = await response.json();

      if (response.ok) {
        setAttendance(data.attendance || []);
        setFilteredAttendance(data.attendance || []);
        setSummary(data.summary || {
          totalEnrolled: 0,
          attended: 0,
          absent: 0,
          attendanceRate: 0
        });
      } else {
        setError(data.error || 'Failed to fetch attendance');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  }, [classData.id]);

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
    }
  }, [isOpen, fetchAttendance]);

  useEffect(() => {
    // Apply filters
    let filtered = attendance;

    // Status filter
    if (filterStatus === 'attended') {
      filtered = filtered.filter((a) => a.status === 'ATTENDED');
    } else if (filterStatus === 'absent') {
      filtered = filtered.filter((a) => a.status === 'ABSENT' || a.status === 'ENROLLED');
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

    setFilteredAttendance(filtered);
  }, [searchQuery, filterStatus, attendance]);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Check-In Time', 'Enrolled Date'];
    const rows = filteredAttendance.map((record) => [
      record.name,
      record.email,
      record.phone,
      record.status,
      record.checkInTime ? new Date(record.checkInTime).toLocaleString() : 'N/A',
      new Date(record.enrolledAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${classData.name.replace(/\s+/g, '_')}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Class Attendance</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-1 text-blue-100">
              <p className="text-lg font-semibold">{classData.name}</p>
              <p className="text-sm">Instructor: {classData.instructor}</p>
              <p className="text-sm">{classData.schedule} • {classData.duration} minutes</p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{summary.totalEnrolled}</p>
              <p className="text-xs text-gray-500">Total Enrolled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summary.attended}</p>
              <p className="text-xs text-gray-500">Attended</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.attendanceRate}%</p>
              <p className="text-xs text-gray-500">Attendance Rate</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b bg-white">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'attended' | 'absent')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="attended">Attended</option>
                <option value="absent">Absent</option>
              </select>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="gap-2"
                disabled={filteredAttendance.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Attendance List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading attendance data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-semibold mb-2">{error}</p>
                <Button onClick={fetchAttendance} variant="outline">
                  Retry
                </Button>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No attendance records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttendance.map((record) => (
                  <motion.div
                    key={record.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {record.avatar ? (
                        <Image
                          src={record.avatar}
                          alt={record.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span>{record.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{record.name}</p>
                      <p className="text-sm text-gray-600 truncate">{record.email}</p>
                      <p className="text-xs text-gray-500">{record.phone}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right flex-shrink-0">
                      {record.status === 'ATTENDED' ? (
                        <div>
                          <div className="flex items-center gap-1 text-green-600 font-semibold mb-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Attended</span>
                          </div>
                          {record.checkInTime && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {new Date(record.checkInTime).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Absent</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredAttendance.length} of {attendance.length} records
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
