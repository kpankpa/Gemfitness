'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, UserMinus, Download, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface EnrolledMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  membershipPlan: string;
  membershipExpiry: string | null;
  enrolledAt: string;
  status: string;
}

interface ClassEnrollmentModalProps {
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
  onEnrollmentChange?: () => void;
}

export default function ClassEnrollmentModal({
  isOpen,
  onClose,
  classData,
  onEnrollmentChange
}: ClassEnrollmentModalProps) {
  const [enrollments, setEnrollments] = useState<EnrolledMember[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrolledMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEnrollments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/classes/${classData.id}/enrollments`);
      const data = await response.json();
      if (data.success) {
        setEnrollments(data.enrollments || []);
      } else {
        setError(data.error || 'Failed to fetch enrollments');
      }
    } catch (err) {
      setError('Failed to fetch enrollments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [classData.id]);

  useEffect(() => {
    if (isOpen) {
      fetchEnrollments();
    }
  }, [isOpen, fetchEnrollments]);

  useEffect(() => {
    // Filter enrollments based on search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredEnrollments(
        enrollments.filter(
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.email.toLowerCase().includes(query) ||
            e.phone.includes(query)
        )
      );
    } else {
      setFilteredEnrollments(enrollments);
    }
  }, [searchQuery, enrollments]);

  const handleUnenroll = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this class?`)) return;

    try {
      const response = await fetch(
        `/api/classes/${classData.id}/enroll?userId=${userId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok) {
        // Refresh enrollments
        await fetchEnrollments();
        onEnrollmentChange?.();
      } else {
        alert(data.error || 'Failed to unenroll member');
      }
    } catch (err) {
      console.error('Error unenrolling:', err);
      alert('Failed to unenroll member');
    }
  };

  const handleExport = () => {
    // Create CSV
    const headers = ['Name', 'Email', 'Phone', 'Membership Plan', 'Enrolled Date'];
    const rows = enrollments.map((e) => [
      e.name,
      e.email,
      e.phone,
      e.membershipPlan,
      new Date(e.enrolledAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData.name}-enrollments-${new Date().toISOString().split('T')[0]}.csv`;
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{classData.name}</h2>
                <p className="text-orange-100 text-sm">
                  {classData.instructor} • {classData.schedule}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {enrollments.length} / {classData.maxCapacity} enrolled
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {classData.maxCapacity - enrollments.length} spots left
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
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={enrollments.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={enrollments.length === 0}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email All
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading enrollments...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchEnrollments} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No members found' : 'No enrollments yet'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Members will appear here once they enroll'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEnrollments.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.profileImage ? (
                        <Image
                          src={member.profileImage}
                          alt={member.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-orange-600">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{member.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="truncate">{member.email}</span>
                        <span className="text-gray-400">•</span>
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {member.membershipPlan.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          Enrolled {new Date(member.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleUnenroll(member.userId, member.name)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredEnrollments.length} of {enrollments.length} members
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
