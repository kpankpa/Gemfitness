'use client';

import Image from 'next/image';
import { X, Mail, Phone, Calendar, ShieldCheck, QrCode, MapPin, HeartPulse, User, CakeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Member } from '@/types';

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function MemberDetailsModal({ isOpen, onClose, member }: MemberDetailsModalProps) {
  if (!isOpen) return null;

  const statusLabel = member.status.replace(/_/g, ' ');
  const fullName = member.firstName && member.lastName 
    ? `${member.firstName} ${member.lastName}`
    : member.name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {member.profileImage ? (
              <Image
                src={member.profileImage}
                alt={fullName}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-8 w-8 text-orange-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Member Details</h3>
              <p className="text-sm text-gray-600">{fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">First Name</label>
                <p className="text-sm text-gray-900">{member.firstName || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Last Name</label>
                <p className="text-sm text-gray-900">{member.lastName || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Email</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {member.email || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Phone</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {member.phone || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Date of Birth</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <CakeIcon className="h-4 w-4 text-gray-500" />
                  {formatDate(member.dateOfBirth)}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Address</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {member.address || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Membership Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Membership Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">Plan</label>
                <p className="text-sm text-gray-900 font-medium">{member.plan || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Status</label>
                <p className={`text-sm font-semibold capitalize ${
                  member.status === 'active' ? 'text-green-600' :
                  member.status === 'expiring_soon' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {statusLabel}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Join Date</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {formatDate(member.joinDate)}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Expires</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {formatDate(member.expiresAt)}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Total Check-ins</label>
                <p className="text-sm text-gray-900 font-medium">{member.totalCheckIns ?? 0}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">QR Code</label>
                <p className="text-sm text-gray-900 flex items-center gap-2 font-mono">
                  <QrCode className="h-4 w-4 text-gray-500" />
                  {member.qrCode || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Registration Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">Registration Type</label>
                <p className="text-sm text-gray-900">
                  {member.registrationType === 'SELF' ? 'Self Registration' :
                   member.registrationType === 'WALK_IN' ? 'Walk-in' :
                   member.registrationType === 'ADMIN' ? 'Admin Registered' : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Registration Fee</label>
                <p className={`text-sm font-semibold ${member.registrationPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {member.registrationPaid ? '✓ Paid' : '✗ Unpaid'}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">Contact Name</label>
                <p className="text-sm text-gray-900">{member.emergencyContact || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Contact Phone</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {member.emergencyPhone || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Health Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">PAR-Q Status</label>
                <p className={`text-sm font-semibold flex items-center gap-2 ${member.parqCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                  <ShieldCheck className="h-4 w-4" />
                  {member.parqCompleted ? 'Completed' : 'Not Completed'}
                </p>
                {member.parqCompletedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed: {formatDateTime(member.parqCompletedAt)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Risk Level</label>
                <p className={`text-sm font-semibold capitalize ${
                  member.parqRiskLevel === 'low' ? 'text-green-600' :
                  member.parqRiskLevel === 'medium' ? 'text-yellow-600' :
                  member.parqRiskLevel === 'high' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {member.parqRiskLevel || '—'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500">Medical Conditions</label>
                <p className="text-sm text-gray-900 flex items-start gap-2">
                  <HeartPulse className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span>{member.medicalConditions || 'None reported'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Fitness Goals */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Fitness Goals</h4>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
              {member.fitnessGoals || 'No fitness goals specified'}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>
    </div>
  );
}
