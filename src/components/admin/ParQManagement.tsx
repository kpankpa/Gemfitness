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

      {/* Details Modal Placeholder */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">PAR-Q Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Member</p>
                  <p className="font-semibold">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <div className="mt-1">{getRiskBadge(selectedMember.parqRiskLevel)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p>
                    {selectedMember.parqCompletedAt
                      ? new Date(selectedMember.parqCompletedAt).toLocaleString('en-GB')
                      : 'Not completed'}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Full PAR-Q response details would be fetched from the ParQResponse table
                    and displayed here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
