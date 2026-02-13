'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, AlertTriangle, CheckCircle2, Clock, Eye, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ParQMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  parqCompleted: boolean;
  parqCompletedAt: Date | null;
  parqRiskLevel: string | null;
}

interface ParQStats {
  total: number;
  completed: number;
  pending: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
}

const parqQuestions = [
  {
    id: 'heartCondition',
    question: 'Has your doctor ever said that you have a heart condition and that you should only perform physical activity recommended by a doctor?'
  },
  {
    id: 'chestPain',
    question: 'Do you feel pain in your chest when you perform physical activity?'
  },
  {
    id: 'chestPainRest',
    question: 'In the past month, have you had chest pain when you were not performing any physical activity?'
  },
  {
    id: 'lossOfBalance',
    question: 'Do you lose your balance because of dizziness or do you ever lose consciousness?'
  },
  {
    id: 'boneJoint',
    question: 'Do you have a bone or joint problem that could be made worse by a change in your physical activity?'
  },
  {
    id: 'medication',
    question: 'Is your doctor currently prescribing medication for your blood pressure or heart condition?'
  },
  {
    id: 'otherReason',
    question: 'Do you know of any other reason why you should not engage in physical activity?'
  },
] as const;

type ParqQuestionId = (typeof parqQuestions)[number]['id'];

interface ParQResponseData {
  id: string;
  responses: Record<string, boolean>;
  otherReasonDetails: string | null;
  riskLevel: 'low' | 'medium' | 'high';
  completedAt: string;
}

export default function ParQManagement() {
  const [members, setMembers] = useState<ParQMember[]>([]);
  const [stats, setStats] = useState<ParQStats>({
    total: 0,
    completed: 0,
    pending: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'low' | 'medium' | 'high'>('all');
  const [selectedMember, setSelectedMember] = useState<ParQMember | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [detailsSuccess, setDetailsSuccess] = useState('');
  const [responseData, setResponseData] = useState<ParQResponseData | null>(null);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [otherReasonDetails, setOtherReasonDetails] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchParQData();
  }, []);

  const fetchParQData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/members');
      const data = await response.json();

      if (data.members) {
        setMembers(data.members);
        
        // Calculate stats
        const total = data.members.length;
        const completed = data.members.filter((m: ParQMember) => m.parqCompleted).length;
        const pending = total - completed;
        const lowRisk = data.members.filter((m: ParQMember) => m.parqRiskLevel === 'low').length;
        const mediumRisk = data.members.filter((m: ParQMember) => m.parqRiskLevel === 'medium').length;
        const highRisk = data.members.filter((m: ParQMember) => m.parqRiskLevel === 'high').length;

        setStats({ total, completed, pending, lowRisk, mediumRisk, highRisk });
      }
    } catch (error) {
      console.error('Error fetching PAR-Q data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName} ${member.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && member.parqCompleted) ||
      (filterStatus === 'pending' && !member.parqCompleted) ||
      (filterStatus === 'low' && member.parqRiskLevel === 'low') ||
      (filterStatus === 'medium' && member.parqRiskLevel === 'medium') ||
      (filterStatus === 'high' && member.parqRiskLevel === 'high');

    return matchesSearch && matchesFilter;
  });

  const getRiskBadge = (riskLevel: string | null) => {
    if (!riskLevel) return null;

    const styles = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[riskLevel as keyof typeof styles]}`}>
        {riskLevel.toUpperCase()} RISK
      </span>
    );
  };

  const calculateRiskLevel = (currentResponses: Record<string, boolean>): 'low' | 'medium' | 'high' => {
    const yesCount = Object.values(currentResponses).filter(Boolean).length;
    if (yesCount === 0) return 'low';
    if (yesCount <= 2) return 'medium';
    return 'high';
  };

  const normalizeResponses = (incoming: Record<string, boolean>) => {
    const normalized: Record<string, boolean> = {};
    parqQuestions.forEach((q) => {
      normalized[q.id] = incoming[q.id] === true;
    });
    return normalized;
  };

  const loadParqDetails = async (member: ParQMember) => {
    setDetailsLoading(true);
    setDetailsError('');
    setDetailsSuccess('');
    setResponseData(null);
    setIsEditing(false);

    try {
      const response = await fetch(`/api/admin/parq/${member.id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setDetailsError(data.error || 'Failed to load PAR-Q details');
        return;
      }

      if (!data.data.response) {
        setDetailsError('No PAR-Q response found for this member');
        return;
      }

      const responseRecord = data.data.response as ParQResponseData;
      const normalized = normalizeResponses(responseRecord.responses || {});

      setResponseData(responseRecord);
      setResponses(normalized);
      setOtherReasonDetails(responseRecord.otherReasonDetails || '');
      setCompletedAt(responseRecord.completedAt || '');
    } catch (error) {
      console.error('Failed to load PAR-Q details:', error);
      setDetailsError('Failed to load PAR-Q details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleResponseChange = (questionId: ParqQuestionId, value: boolean) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setDetailsError('');
    setDetailsSuccess('');
  };

  const handleSave = async () => {
    if (!selectedMember || !responseData) return;

    const missing = parqQuestions.filter(
      (q) => responses[q.id] !== true && responses[q.id] !== false
    );
    if (missing.length > 0) {
      setDetailsError('Please answer all questions before saving');
      return;
    }

    if (responses.otherReason && !otherReasonDetails.trim()) {
      setDetailsError('Please provide details for the other reason response');
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    if (!selectedMember || !responseData) return;

    setShowConfirmDialog(false);
    setIsSaving(true);
    setDetailsError('');
    setDetailsSuccess('');

    try {
      const response = await fetch(`/api/admin/parq/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          otherReasonDetails: otherReasonDetails || undefined,
          completedAt: completedAt || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setDetailsError(data.error || 'Failed to update PAR-Q responses');
        return;
      }

      setDetailsSuccess('PAR-Q responses updated successfully');
      setIsEditing(false);
      await fetchParQData();
    } catch (error) {
      console.error('Failed to update PAR-Q responses:', error);
      setDetailsError('Failed to update PAR-Q responses');
    } finally {
      setIsSaving(false);
    }
  };

  const currentRiskLevel = responseData ? calculateRiskLevel(responses) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="border-2 border-orange-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                PAR-Q Health Screening
              </CardTitle>
              <CardDescription>Physical Activity Readiness Questionnaire monitoring and safety advice</CardDescription>
            </div>
            <Button
              onClick={fetchParQData}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Refresh Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Heart className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
                </p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
              </div>
              <Clock className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Risk</p>
                <p className="text-3xl font-bold text-green-600">{stats.lowRisk}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.mediumRisk}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Advice Banner */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Safety Guidelines for High-Risk Members</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Require medical clearance before starting exercise program</li>
                <li>• Start with low-intensity activities and progress gradually</li>
                <li>• Monitor closely during initial sessions</li>
                <li>• Consider one-on-one training sessions</li>
                <li>• Keep emergency contact information readily available</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Members</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member PAR-Q Status</CardTitle>
          <CardDescription>
            Showing {filteredMembers.length} of {members.length} members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No members found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Member</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Risk Level</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Completed</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{member.email}</td>
                      <td className="py-3 px-4 text-center">
                        {member.parqCompleted ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {member.parqCompleted ? (
                          getRiskBadge(member.parqRiskLevel)
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-600">
                        {member.parqCompletedAt
                          ? new Date(member.parqCompletedAt).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {member.parqCompleted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowDetailsModal(true);
                              loadParqDetails(member);
                            }}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">PAR-Q Details</h3>
                  <p className="text-sm text-gray-600">
                    {selectedMember.firstName} {selectedMember.lastName} - {selectedMember.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ✕
                </Button>
              </div>

              {detailsLoading && (
                <div className="text-center py-6 text-gray-500">Loading details...</div>
              )}

              {!detailsLoading && detailsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {detailsError}
                </div>
              )}

              {!detailsLoading && detailsSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {detailsSuccess}
                </div>
              )}

              {!detailsLoading && responseData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <div className="mt-1">{getRiskBadge(currentRiskLevel)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-sm text-gray-900">
                        {responseData.completedAt
                          ? new Date(responseData.completedAt).toLocaleString('en-GB')
                          : 'Not completed'}
                      </p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    {parqQuestions.map((q, index) => {
                      const answer = responses[q.id];
                      return (
                        <div key={q.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                          <p className="text-sm font-medium text-gray-900">
                            {index + 1}. {q.question}
                          </p>
                          {isEditing ? (
                            <div className="mt-2 flex gap-4">
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="radio"
                                  name={q.id}
                                  checked={responses[q.id] === true}
                                  onChange={() => handleResponseChange(q.id, true)}
                                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                />
                                Yes
                              </label>
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="radio"
                                  name={q.id}
                                  checked={responses[q.id] === false}
                                  onChange={() => handleResponseChange(q.id, false)}
                                  className="w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300"
                                />
                                No
                              </label>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-700">
                              {answer === true ? 'Yes' : answer === false ? 'No' : 'Not answered'}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {responses.otherReason && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Other reason details</p>
                        {isEditing ? (
                          <>
                            <textarea
                              value={otherReasonDetails}
                              onChange={(e) => setOtherReasonDetails(e.target.value)}
                              maxLength={1000}
                              rows={3}
                              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Provide details..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {otherReasonDetails.length}/1000 characters
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-sm text-gray-700">
                            {otherReasonDetails || 'No details provided'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!responseData) return;
                            setIsEditing(false);
                            setResponses(normalizeResponses(responseData.responses));
                            setOtherReasonDetails(responseData.otherReasonDetails || '');
                            setCompletedAt(responseData.completedAt || '');
                            setDetailsError('');
                            setDetailsSuccess('');
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Responses
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm PAR-Q Changes</h3>
                <p className="text-sm text-gray-600">
                  You are about to update the health screening responses for{' '}
                  <strong>{selectedMember?.firstName} {selectedMember?.lastName}</strong>.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {currentRiskLevel && (
                    <>New risk level: <strong className={`${
                      currentRiskLevel === 'high' ? 'text-red-600' : 
                      currentRiskLevel === 'medium' ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>{currentRiskLevel.toUpperCase()}</strong></>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This action will be logged in the audit trail.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSave}
                disabled={isSaving}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Confirm Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
