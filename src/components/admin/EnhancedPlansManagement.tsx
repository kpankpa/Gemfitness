'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Crown,
  Check,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Settings,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ENHANCED_PLAN_TEMPLATES,
  EnhancedPlan
} from '@/lib/plans/enhanced-features';

// Type alias for plan templates
type PlanTemplate = EnhancedPlan;

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  duration: number;
  durationUnit: string;
  features: string[];
  isPopular: boolean;
  isFeatured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  activeMembers: number;
  totalRevenue: number;
  displayOrder: number;
  createdAt: string;
}

interface PlanAnalytics {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalActiveSubscriptions: number;
  newSubscriptionsLast7Days: number;
  newSubscriptionsLast30Days: number;
  expiringInNext30Days: number;
  churnRate: number;
  topPerformingPlan: string;
  planMetrics?: Array<{
    plan: string;
    newSubscriptions7Days: number;
    newSubscriptions30Days: number;
    expiringSoon: number;
    renewalRate: number;
  }>;
}

interface EnhancedPlansManagementProps {
  onClose?: () => void;
}

export default function EnhancedPlansManagement({ onClose: _onClose }: EnhancedPlansManagementProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [analytics, setAnalytics] = useState<PlanAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'analytics' | 'features'>('cards');

  // Form data for creating/editing plans
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    duration: 30,
    durationUnit: 'days',
    features: [] as string[],
    isPopular: false,
    isFeatured: false,
    displayOrder: 0
  });

  useEffect(() => {
    fetchPlans();
    fetchAnalytics();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/plans/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPlans();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPlans();
        setShowEditModal(false);
        setSelectedPlan(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPlans();
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      duration: 30,
      durationUnit: 'days',
      features: [],
      isPopular: false,
      isFeatured: false,
      displayOrder: 0
    });
  };

  const openEditModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      duration: plan.duration,
      durationUnit: plan.durationUnit,
      features: plan.features,
      isPopular: plan.isPopular,
      isFeatured: plan.isFeatured,
      displayOrder: plan.displayOrder
    });
    setShowEditModal(true);
  };

  const handleUseTemplate = (template: PlanTemplate) => {
    setFormData({
      name: template.name,
      slug: template.slug,
      description: template.description,
      price: template.price,
      duration: template.duration,
      durationUnit: template.durationUnit,
      features: template.features,
      isPopular: template.isPopular,
      isFeatured: template.isFeatured,
      displayOrder: 0
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Plans Management</h2>
          <p className="text-gray-600">Manage membership plans with advanced features and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('cards')}
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
          >
            <Package className="h-4 w-4 mr-1" />Cards
          </Button>
          <Button
            onClick={() => setViewMode('analytics')}
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            size="sm"
          >
            <TrendingUp className="h-4 w-4 mr-1" />Analytics
          </Button>
          <Button
            onClick={() => setViewMode('features')}
            variant={viewMode === 'features' ? 'default' : 'outline'}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-1" />Features
          </Button>
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue (MRR)</p>
                  <p className="text-2xl font-bold text-green-600">
                    GH₵ {analytics.monthlyRecurringRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">ARR: GH₵ {analytics.annualRecurringRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalActiveSubscriptions}</p>
                  <p className="text-xs text-gray-500">{plans.filter(p => p.status === 'ACTIVE').length} active plans</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New (30 days)</p>
                  <p className="text-2xl font-bold text-purple-600">+{analytics.newSubscriptionsLast30Days}</p>
                  <p className="text-xs text-gray-500">+{analytics.newSubscriptionsLast7Days} last 7 days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.expiringInNext30Days}</p>
                  <p className="text-xs text-gray-500">Churn: {analytics.churnRate}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Plan Templates */}
      {viewMode === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              Enhanced Plan Templates
            </CardTitle>
            <CardDescription>
              Use these industry-standard templates to create optimized plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {ENHANCED_PLAN_TEMPLATES.map((template) => (
                <Card key={template.id} className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{template.name}</h3>
                      {template.isPopular && <Star className="h-4 w-4 text-orange-500" />}
                      {template.isFeatured && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="text-xl font-bold text-orange-600 mb-3">
                      GH₵{template.price}
                      <span className="text-sm text-gray-600">/{template.duration} {template.durationUnit}</span>
                    </div>
                    <div className="space-y-1 mb-4">
                      <p className="text-xs text-gray-500">Features ({template.features.length}):</p>
                      <div className="text-xs text-gray-600">
                        {template.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            {feature}
                          </div>
                        ))}
                        {template.features.length > 3 && (
                          <p className="text-gray-400">+{template.features.length - 3} more...</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      size="sm"
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Management */}
      {viewMode === 'cards' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Current Plans ({plans.length})</h3>
            <Button onClick={() => setShowCreateModal(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-1" />Create Plan
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`transition-all hover:shadow-lg ${
                plan.isPopular ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      {plan.isPopular && <Star className="h-4 w-4 text-orange-500" />}
                      {plan.isFeatured && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      plan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      plan.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {plan.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-orange-600">
                      GH₵{plan.price}
                      <span className="text-sm text-gray-600">/{plan.duration} {plan.durationUnit}</span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Members:</span>
                      <span className="font-semibold">{plan.activeMembers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Revenue:</span>
                      <span className="font-semibold">GH₵{plan.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Features:</span>
                      <span className="font-semibold">{plan.features.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openEditModal(plan)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />Edit
                    </Button>
                    <Button
                      onClick={() => handleDeletePlan(plan.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Modals - simplified implementation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Plan</CardTitle>
              <CardDescription>Add a new membership plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Plan creation form coming soon...</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={handleCreatePlan} className="bg-orange-500 hover:bg-orange-600">Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {showEditModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Plan: {selectedPlan.name}</CardTitle>
              <CardDescription>Update membership plan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Plan editing form coming soon...</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button onClick={handleUpdatePlan} className="bg-orange-500 hover:bg-orange-600">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}