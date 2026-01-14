/**
 * Enhanced Plan Features System
 * Based on industry best practices from Anytime Fitness, GitHub, Stripe, and Notion
 */

export interface FeatureCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  isHighlight?: boolean;
  valueProposition?: string;
}

export interface EnhancedPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number; // For showing discounts
  duration: number;
  durationUnit: 'days' | 'months' | 'years';
  isPopular: boolean;
  isFeatured: boolean;
  
  // Enhanced features
  features: string[]; // Keep original for backward compatibility
  categorizedFeatures: {
    categoryId: string;
    features: PlanFeature[];
  }[];
  
  // Value propositions
  valuePropositions: string[];
  targetAudience: string;
  
  // Savings calculations
  annualSavings?: number;
  comparedToPlan?: string; // Compare to another plan
  
  // Social proof
  testimonials?: {
    name: string;
    quote: string;
    image?: string;
    plan: string;
    achievement?: string;
  }[];
  
  // Analytics
  popularity?: number; // 0-100 score
  conversionRate?: number;
  memberCount?: number;
}

// Feature Categories (inspired by industry leaders)
export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: 'access',
    name: 'Gym Access',
    icon: 'door-open',
    description: 'When and how you can access our facilities'
  },
  {
    id: 'equipment',
    name: 'Equipment & Facilities',
    icon: 'dumbbell',
    description: 'Access to equipment, machines, and special areas'
  },
  {
    id: 'classes',
    name: 'Classes & Training',
    icon: 'users',
    description: 'Group classes, personal training, and instruction'
  },
  {
    id: 'wellness',
    name: 'Health & Wellness',
    icon: 'heart',
    description: 'Health assessments, nutrition, and wellness services'
  },
  {
    id: 'amenities',
    name: 'Amenities & Services',
    icon: 'sparkles',
    description: 'Comfort features and additional services'
  },
  {
    id: 'support',
    name: 'Support & Extras',
    icon: 'headphones',
    description: 'Customer support, apps, and bonus features'
  }
];

// Comprehensive feature library
export const PLAN_FEATURES: PlanFeature[] = [
  // Access Features
  {
    id: 'gym_access_standard',
    name: 'Full gym access during operating hours',
    categoryId: 'access',
    description: 'Access to all main workout areas during regular hours'
  },
  {
    id: 'gym_access_24_7',
    name: '24/7 gym access',
    categoryId: 'access',
    description: 'Round-the-clock access with keycard entry',
    isHighlight: true,
    valueProposition: 'Work out on your schedule, anytime'
  },
  {
    id: 'priority_access',
    name: 'Priority facility access',
    categoryId: 'access',
    description: 'Skip the queue during peak hours',
    valueProposition: 'No waiting, even during busy times'
  },
  
  // Equipment Features
  {
    id: 'cardio_equipment',
    name: 'All cardio equipment',
    categoryId: 'equipment',
    description: 'Treadmills, bikes, ellipticals, rowing machines'
  },
  {
    id: 'strength_equipment',
    name: 'Complete strength equipment',
    categoryId: 'equipment',
    description: 'Free weights, machines, functional training area'
  },
  {
    id: 'premium_equipment',
    name: 'Premium & specialized equipment',
    categoryId: 'equipment',
    description: 'Latest machines, specialized tools, VIP equipment area',
    isHighlight: true
  },
  
  // Classes Features
  {
    id: 'group_classes',
    name: 'Group fitness classes',
    categoryId: 'classes',
    description: 'HIIT, Yoga, Zumba, and more'
  },
  {
    id: 'priority_booking',
    name: 'Priority class booking',
    categoryId: 'classes',
    description: 'Book popular classes before others',
    valueProposition: 'Never miss your favorite class'
  },
  {
    id: 'personal_training_1',
    name: '1 free personal training session',
    categoryId: 'classes',
    description: 'One-on-one coaching session included'
  },
  {
    id: 'personal_training_unlimited',
    name: 'Unlimited personal training',
    categoryId: 'classes',
    description: 'Unlimited PT sessions with certified trainers',
    isHighlight: true,
    valueProposition: 'Accelerate your fitness journey with expert guidance'
  },
  
  // Wellness Features
  {
    id: 'fitness_assessment',
    name: 'Free fitness assessment',
    categoryId: 'wellness',
    description: 'Initial fitness evaluation and goal setting'
  },
  {
    id: 'nutrition_consultation',
    name: 'Nutrition consultation',
    categoryId: 'wellness',
    description: 'Personalized meal planning and dietary advice'
  },
  {
    id: 'progress_tracking',
    name: 'Progress tracking & monitoring',
    categoryId: 'wellness',
    description: 'Digital progress reports and body composition analysis',
    valueProposition: 'See your transformation with data'
  },
  {
    id: 'health_coaching',
    name: 'Monthly health coaching',
    categoryId: 'wellness',
    description: 'Regular check-ins with wellness experts',
    isHighlight: true
  },
  
  // Amenities Features
  {
    id: 'locker_showers',
    name: 'Locker room & showers',
    categoryId: 'amenities',
    description: 'Clean changing facilities and hot showers'
  },
  {
    id: 'towel_service',
    name: 'Complimentary towel service',
    categoryId: 'amenities',
    description: 'Fresh, clean towels provided'
  },
  {
    id: 'guest_passes',
    name: 'Guest passes (2 per quarter)',
    categoryId: 'amenities',
    description: 'Bring friends to work out with you'
  },
  {
    id: 'guest_passes_unlimited',
    name: 'Unlimited guest passes',
    categoryId: 'amenities',
    description: 'Bring friends and family anytime',
    isHighlight: true,
    valueProposition: 'Share the fitness journey with loved ones'
  },
  {
    id: 'parking',
    name: 'Free parking',
    categoryId: 'amenities',
    description: 'Dedicated member parking spaces'
  },
  {
    id: 'merchandise_discount',
    name: '10% merchandise discount',
    categoryId: 'amenities',
    description: 'Discount on gym apparel and supplements'
  },
  
  // Support Features
  {
    id: 'mobile_app',
    name: 'Mobile app access',
    categoryId: 'support',
    description: 'Book classes, track workouts, connect with community'
  },
  {
    id: 'priority_support',
    name: 'Priority customer support',
    categoryId: 'support',
    description: 'Faster response times for questions and issues'
  },
  {
    id: 'member_events',
    name: 'Exclusive member events',
    categoryId: 'support',
    description: 'Special workshops, challenges, and social events'
  }
];

// Enhanced Plan Templates
export const ENHANCED_PLAN_TEMPLATES: EnhancedPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Essential',
    slug: 'ONE_MONTH',
    description: 'Perfect for getting started on your fitness journey',
    price: 200,
    duration: 1,
    durationUnit: 'months',
    isPopular: false,
    isFeatured: false,
    features: [
      'Full gym access',
      'All equipment',
      'Group classes',
      'Locker room & showers',
      'Free fitness assessment'
    ],
    categorizedFeatures: [
      {
        categoryId: 'access',
        features: [
          PLAN_FEATURES.find(f => f.id === 'gym_access_standard')!
        ]
      },
      {
        categoryId: 'equipment',
        features: [
          PLAN_FEATURES.find(f => f.id === 'cardio_equipment')!,
          PLAN_FEATURES.find(f => f.id === 'strength_equipment')!
        ]
      },
      {
        categoryId: 'classes',
        features: [
          PLAN_FEATURES.find(f => f.id === 'group_classes')!
        ]
      },
      {
        categoryId: 'wellness',
        features: [
          PLAN_FEATURES.find(f => f.id === 'fitness_assessment')!
        ]
      },
      {
        categoryId: 'amenities',
        features: [
          PLAN_FEATURES.find(f => f.id === 'locker_showers')!
        ]
      }
    ],
    valuePropositions: [
      'Flexible month-to-month commitment',
      'Try before you commit long-term',
      'Access to all basic amenities'
    ],
    targetAudience: 'Beginners and those wanting flexibility'
  },
  {
    id: 'quarterly',
    name: 'Quarterly Commitment',
    slug: 'THREE_MONTHS',
    description: 'Our most popular plan - Save GH₵100 and get premium features!',
    price: 500,
    originalPrice: 600,
    annualSavings: 100,
    comparedToPlan: 'monthly',
    duration: 3,
    durationUnit: 'months',
    isPopular: true,
    isFeatured: false,
    features: [
      'Everything in Monthly',
      'Priority booking',
      '1 free personal training session',
      'Nutrition consultation',
      'Progress tracking',
      'Towel service',
      'Member events access',
      'Free guest passes (2/quarter)',
      'Mobile app access',
      '10% merchandise discount'
    ],
    categorizedFeatures: [
      {
        categoryId: 'access',
        features: [
          PLAN_FEATURES.find(f => f.id === 'gym_access_standard')!,
          PLAN_FEATURES.find(f => f.id === 'priority_access')!
        ]
      },
      {
        categoryId: 'equipment',
        features: [
          PLAN_FEATURES.find(f => f.id === 'cardio_equipment')!,
          PLAN_FEATURES.find(f => f.id === 'strength_equipment')!
        ]
      },
      {
        categoryId: 'classes',
        features: [
          PLAN_FEATURES.find(f => f.id === 'group_classes')!,
          PLAN_FEATURES.find(f => f.id === 'priority_booking')!,
          PLAN_FEATURES.find(f => f.id === 'personal_training_1')!
        ]
      },
      {
        categoryId: 'wellness',
        features: [
          PLAN_FEATURES.find(f => f.id === 'fitness_assessment')!,
          PLAN_FEATURES.find(f => f.id === 'nutrition_consultation')!,
          PLAN_FEATURES.find(f => f.id === 'progress_tracking')!
        ]
      },
      {
        categoryId: 'amenities',
        features: [
          PLAN_FEATURES.find(f => f.id === 'locker_showers')!,
          PLAN_FEATURES.find(f => f.id === 'towel_service')!,
          PLAN_FEATURES.find(f => f.id === 'guest_passes')!,
          PLAN_FEATURES.find(f => f.id === 'merchandise_discount')!
        ]
      },
      {
        categoryId: 'support',
        features: [
          PLAN_FEATURES.find(f => f.id === 'mobile_app')!,
          PLAN_FEATURES.find(f => f.id === 'member_events')!
        ]
      }
    ],
    valuePropositions: [
      'Best value for committed fitness enthusiasts',
      'Save GH₵100 compared to monthly payments',
      'Premium features included',
      'Build lasting fitness habits'
    ],
    targetAudience: 'Serious fitness enthusiasts ready to commit',
    testimonials: [
      {
        name: 'Sarah K.',
        quote: 'The quarterly plan gave me everything I needed to transform my health. The personal training session was a game-changer!',
        plan: 'Quarterly Commitment',
        achievement: 'Lost 15kg in 3 months'
      }
    ]
  },
  {
    id: 'annual',
    name: 'Annual Champion',
    slug: 'ONE_YEAR',
    description: 'Ultimate value - Save GH₵1,200 and unlock all premium features!',
    price: 2200,
    originalPrice: 3400,
    annualSavings: 1200,
    comparedToPlan: 'monthly',
    duration: 1,
    durationUnit: 'years',
    isPopular: false,
    isFeatured: true,
    features: [
      'Everything in Quarterly',
      '24/7 gym access',
      'Unlimited personal training',
      'Monthly nutrition plan & tracking',
      'Premium equipment access',
      'Unlimited guest passes',
      'Priority customer support',
      'Exclusive member events',
      'Free merchandise',
      'Monthly health coaching'
    ],
    categorizedFeatures: [
      {
        categoryId: 'access',
        features: [
          PLAN_FEATURES.find(f => f.id === 'gym_access_24_7')!,
          PLAN_FEATURES.find(f => f.id === 'priority_access')!
        ]
      },
      {
        categoryId: 'equipment',
        features: [
          PLAN_FEATURES.find(f => f.id === 'cardio_equipment')!,
          PLAN_FEATURES.find(f => f.id === 'strength_equipment')!,
          PLAN_FEATURES.find(f => f.id === 'premium_equipment')!
        ]
      },
      {
        categoryId: 'classes',
        features: [
          PLAN_FEATURES.find(f => f.id === 'group_classes')!,
          PLAN_FEATURES.find(f => f.id === 'priority_booking')!,
          PLAN_FEATURES.find(f => f.id === 'personal_training_unlimited')!
        ]
      },
      {
        categoryId: 'wellness',
        features: [
          PLAN_FEATURES.find(f => f.id === 'fitness_assessment')!,
          PLAN_FEATURES.find(f => f.id === 'nutrition_consultation')!,
          PLAN_FEATURES.find(f => f.id === 'progress_tracking')!,
          PLAN_FEATURES.find(f => f.id === 'health_coaching')!
        ]
      },
      {
        categoryId: 'amenities',
        features: [
          PLAN_FEATURES.find(f => f.id === 'locker_showers')!,
          PLAN_FEATURES.find(f => f.id === 'towel_service')!,
          PLAN_FEATURES.find(f => f.id === 'guest_passes_unlimited')!,
          PLAN_FEATURES.find(f => f.id === 'parking')!
        ]
      },
      {
        categoryId: 'support',
        features: [
          PLAN_FEATURES.find(f => f.id === 'mobile_app')!,
          PLAN_FEATURES.find(f => f.id === 'priority_support')!,
          PLAN_FEATURES.find(f => f.id === 'member_events')!
        ]
      }
    ],
    valuePropositions: [
      'Maximum savings - save over GH₵1,200 annually',
      'Complete fitness ecosystem access',
      'Unlimited personal training worth GH₵3,600',
      'VIP treatment and priority access'
    ],
    targetAudience: 'Dedicated athletes and fitness enthusiasts',
    testimonials: [
      {
        name: 'Michael T.',
        quote: 'One year later, I\'ve achieved goals I never thought possible. The unlimited PT sessions changed everything.',
        plan: 'Annual Champion',
        achievement: 'Completed first bodybuilding competition'
      }
    ]
  }
];

/**
 * Calculate savings compared to monthly plan
 */
export function calculateSavings(plan: EnhancedPlan): number {
  const monthlyRate = 200; // Base monthly rate
  const planMonthlyRate = plan.durationUnit === 'months' 
    ? plan.price / plan.duration
    : plan.price / (plan.duration * 12);
  
  const monthlySavings = monthlyRate - planMonthlyRate;
  return plan.durationUnit === 'months' 
    ? monthlySavings * plan.duration
    : monthlySavings * 12;
}

/**
 * Get popular features across all plans
 */
export function getPopularFeatures(): PlanFeature[] {
  return PLAN_FEATURES.filter(feature => feature.isHighlight);
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(categoryId: string): PlanFeature[] {
  return PLAN_FEATURES.filter(feature => feature.categoryId === categoryId);
}