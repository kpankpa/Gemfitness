'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Star, 
  Trophy, 
  Crown, 
  Heart,
  Users,
  Dumbbell,
  Clock,
  Sparkles,
  Headphones
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Plan, FeatureCategory } from '@/types';

interface PlanComparisonProps {
  plans: Plan[];
  showAllFeatures?: boolean;
  highlightPopular?: boolean;
  className?: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'access': Clock,
  'equipment': Dumbbell,
  'classes': Users,
  'wellness': Heart,
  'amenities': Sparkles,
  'support': Headphones
};

const categories: FeatureCategory[] = [
  { id: 'access', name: 'Gym Access', icon: 'clock', description: 'When and how you can access facilities' },
  { id: 'equipment', name: 'Equipment', icon: 'dumbbell', description: 'Access to equipment and machines' },
  { id: 'classes', name: 'Classes & Training', icon: 'users', description: 'Group classes and personal training' },
  { id: 'wellness', name: 'Health & Wellness', icon: 'heart', description: 'Health services and assessments' },
  { id: 'amenities', name: 'Amenities', icon: 'sparkles', description: 'Comfort features and services' },
  { id: 'support', name: 'Support & Extras', icon: 'headphones', description: 'Customer support and apps' }
];

export default function PlanComparison({ 
  plans, 
  showAllFeatures = false,
  highlightPopular = true,
  className = '' 
}: PlanComparisonProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['access', 'classes']);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getAllFeatures = () => {
    const allFeatures: Record<string, Set<string>> = {};
    
    plans.forEach(plan => {
      plan.categorizedFeatures?.forEach(cat => {
        if (!allFeatures[cat.categoryId]) {
          allFeatures[cat.categoryId] = new Set();
        }
        cat.features.forEach(feature => {
          allFeatures[cat.categoryId].add(feature.name);
        });
      });
      
      // Fallback to basic features if categorized features not available
      if (!plan.categorizedFeatures) {
        if (!allFeatures['basic']) allFeatures['basic'] = new Set();
        plan.features.forEach(feature => allFeatures['basic'].add(feature));
      }
    });
    
    return allFeatures;
  };

  const hasFeature = (plan: Plan, categoryId: string, featureName: string): boolean => {
    if (plan.categorizedFeatures) {
      const category = plan.categorizedFeatures.find(cat => cat.categoryId === categoryId);
      return category?.features.some(f => f.name === featureName) || false;
    }
    // Fallback to basic features
    return plan.features.includes(featureName);
  };

  if (viewMode === 'comparison') {
    const allFeatures = getAllFeatures();
    
    return (
      <div className={`space-y-6 ${className}`}>
        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('grid')}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600"
            >
              Card View
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-gray-900 shadow-sm"
            >
              Compare Features
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b-2 border-gray-200">Features</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-4 border-b-2 border-gray-200 min-w-[200px]">
                    <div className="space-y-2">
                      {plan.isPopular && highlightPopular && (
                        <span className="inline-block px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-center justify-center gap-1">
                        {plan.isFeatured && <Crown className="h-4 w-4 text-yellow-500" />}
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        GH₵{plan.price}
                        <span className="text-sm text-gray-600">/{plan.duration} {plan.durationUnit}</span>
                      </div>
                      <Link href={`/signup?plan=${plan.slug.toLowerCase()}`}>
                        <Button className={`w-full text-white ${
                          plan.isPopular ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-900 hover:bg-gray-800'
                        }`}>
                          Choose Plan
                        </Button>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(allFeatures).map(([categoryId, features]) => {
                const category = categories.find(c => c.id === categoryId);
                const CategoryIcon = categoryIcons[categoryId] || Clock;
                
                return (
                  <React.Fragment key={categoryId}>
                    <tr className="bg-gray-50">
                      <td colSpan={plans.length + 1} className="p-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleCategory(categoryId)}
                          className="flex items-center gap-2 w-full text-left hover:text-orange-600 transition-colors"
                        >
                          <CategoryIcon className="h-5 w-5" />
                          <span className="font-semibold">{category?.name || categoryId}</span>
                          <span className="text-sm text-gray-500">({features.size} features)</span>
                        </button>
                      </td>
                    </tr>
                    {expandedCategories.includes(categoryId) && Array.from(features).map((featureName) => (
                      <tr key={featureName} className="border-b border-gray-100">
                        <td className="p-4 text-sm">{featureName}</td>
                        {plans.map((plan) => (
                          <td key={`${plan.id}-${featureName}`} className="p-4 text-center">
                            {hasFeature(plan, categoryId, featureName) ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              delay: index * 0.15,
              duration: 0.5,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              y: -6,
              transition: { duration: 0.3 }
            }}
            className={`relative ${plan.isPopular && highlightPopular ? 'lg:-mt-8' : ''}`}
          >
            {plan.isPopular && highlightPopular && (
              <motion.div 
                className="absolute -top-5 left-1/2 -translate-x-1/2 z-20"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white text-sm font-bold px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg">
                  <Star className="w-4 h-4" />
                  <span>Most Popular</span>
                </div>
              </motion.div>
            )}

            <Card
              className={`relative bg-white border-2 transition-all duration-500 h-full group overflow-hidden ${
                plan.isPopular && highlightPopular
                  ? 'border-orange-500 shadow-2xl shadow-orange-500/30 lg:scale-105' 
                  : 'border-gray-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/20'
              }`}
            >
              {/* Gradient Background Effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                plan.isPopular && highlightPopular
                  ? 'bg-gradient-to-br from-orange-50 via-white to-orange-50' 
                  : 'bg-gradient-to-br from-orange-50/50 via-white to-white'
              }`} />

              {plan.isFeatured && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-full" />
              )}

              <div className="p-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div 
                    className={`w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br ${
                      plan.isPopular ? 'from-orange-500 to-orange-600' : 
                      plan.isFeatured ? 'from-yellow-500 to-yellow-600' :
                      'from-gray-500 to-gray-600'
                    } flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {plan.isFeatured ? (
                      <Crown className="w-8 h-8 text-white" />
                    ) : plan.isPopular ? (
                      <Star className="w-8 h-8 text-white" />
                    ) : (
                      <Dumbbell className="w-8 h-8 text-white" />
                    )}
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-2 relative">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {plan.originalPrice && plan.originalPrice > plan.price && (
                        <span className="text-base text-gray-500 line-through">
                          GH₵{plan.originalPrice}
                        </span>
                      )}
                      <div>
                        <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                          GH₵{plan.price}
                        </span>
                        <span className="text-gray-600 text-base">/{plan.duration} {plan.durationUnit}</span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent mb-6" />

                {/* Value Propositions */}
                {plan.valuePropositions && plan.valuePropositions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Why Choose This Plan:</h4>
                    <ul className="space-y-2">
                      {plan.valuePropositions.slice(0, 2).map((value, i) => (
                        <motion.li 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-start gap-3 text-sm text-gray-700"
                        >
                          <Trophy className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          {value}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">What&apos;s Included:</h4>
                  <ul className="space-y-2">
                    {plan.features.slice(0, showAllFeatures ? plan.features.length : 5).map((feature, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </motion.li>
                    ))}
                    {!showAllFeatures && plan.features.length > 5 && (
                      <li className="text-sm text-gray-500">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link href={`/signup?plan=${plan.slug.toLowerCase()}`} className="block">
                  <Button className={`w-full text-white text-base py-4 font-semibold transition-all duration-300 ${
                    plan.isPopular && highlightPopular
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}>
                    {plan.isPopular ? 'Get Started' : 'Choose Plan'}
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}