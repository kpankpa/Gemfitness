'use client';

import { useState } from 'react';
import { Mail, Send, Users, CheckCircle, AlertCircle, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParQCampaignPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalMembers: number;
    completedParQ: number;
    notCompleted: number;
    completionRate: string;
    existingMembersNeedingParQ: number;
    newMembersNeedingParQ: number;
    riskDistribution: { low: number; medium: number; high: number };
  } | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    stats?: {
      totalUsers: number;
      successCount: number;
      failureCount: number;
    };
  } | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/parq-campaign');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const sendCampaign = async () => {
    if (!confirm('Send PAR-Q reminder emails to all members who need it?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/parq-campaign', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert(`✅ Campaign sent! ${data.stats.successCount} emails sent successfully.`);
        await fetchStats(); // Refresh stats
      } else {
        alert(`❌ Campaign failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Campaign error:', error);
      alert('❌ Failed to send campaign emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            PAR-Q Email Campaign
          </h1>
          <p className="text-gray-600">
            Send health screening reminders to existing members
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                PAR-Q Statistics
              </CardTitle>
              <CardDescription>Current completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchStats} variant="outline" className="mb-4">
                Refresh Stats
              </Button>

              {stats && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Total Members</span>
                    <span className="text-lg font-bold">{stats.totalMembers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Completed PAR-Q</span>
                    <span className="text-lg font-bold text-green-600">{stats.completedParQ}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Existing Members Need PAR-Q</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {stats.existingMembersNeedingParQ}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-lg font-bold text-blue-600">{stats.completionRate}%</span>
                  </div>

                  {stats.riskDistribution && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold mb-2">Risk Distribution</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">🟢 Low Risk:</span>
                          <span className="font-medium">{stats.riskDistribution.low}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-600">🟡 Medium Risk:</span>
                          <span className="font-medium">{stats.riskDistribution.medium}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">🔴 High Risk:</span>
                          <span className="font-medium">{stats.riskDistribution.high}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-orange-500" />
                Send Email Campaign
              </CardTitle>
              <CardDescription>Remind members to complete PAR-Q</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>What this does:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                    <li>Finds all members who signed up before PAR-Q implementation</li>
                    <li>Sends email with PAR-Q completion link</li>
                    <li>Sets 30-day deadline for completion</li>
                    <li>Skips members who already completed PAR-Q</li>
                  </ul>
                </div>

                <Button
                  onClick={sendCampaign}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Campaign Emails
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Card */}
        {result && (
          <Card className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                Campaign Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success && result.stats ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-medium">Total Recipients</span>
                    <span className="text-lg font-bold">{result.stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-medium text-green-600">Successfully Sent</span>
                    <span className="text-lg font-bold text-green-600">
                      {result.stats.successCount}
                    </span>
                  </div>
                  {result.stats.failureCount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="font-medium text-red-600">Failed</span>
                      <span className="text-lg font-bold text-red-600">
                        {result.stats.failureCount}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-700">{result.message || result.error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Industry Standard</h3>
                  <p className="text-sm text-gray-600">
                    PAR-Q+ is the international standard for health screening before exercise
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Member Safety</h3>
                  <p className="text-sm text-gray-600">
                    Identify health conditions that need special consideration during training
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Legal Protection</h3>
                  <p className="text-sm text-gray-600">
                    Documented health screening protects both members and the gym
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
