'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Users,
  Clock,
  Heart,
  Zap,
  Calendar,
  Shield,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import PlanComparison from '@/components/PlanComparison';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Plan, GymStats, SuccessStory, FeaturedBenefit } from '@/types';

const memberBenefits = [
  {
    icon: Users,
    title: 'Welcoming Community',
    description: 'A supportive team of members and staff who want to see you succeed.',
  },
  {
    icon: Zap,
    title: 'Modern Equipment',
    description: 'State-of-the-art machines and free weights, maintained and updated regularly.',
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Open early mornings to late evenings, 7 days a week.',
  },
  {
    icon: Heart,
    title: 'Expert Coaching',
    description: 'Certified trainers available to guide your workouts and track progress.',
  },
  {
    icon: Calendar,
    title: 'Group Fitness',
    description: 'More than 50 weekly classes, including HIIT, dance, strength, and stepboard.',
  },
  {
    icon: Shield,
    title: 'Clean & Safe',
    description: 'Sanitized facilities, secure lockers, and a comfortable training environment.',
  },
];

const corporateFeatures = [
  'Discounted group rates for teams',
  'Flexible billing options',
  'Dedicated account manager',
  'Custom wellness programs',
  'On-site fitness assessments',
  'Quarterly health workshops',
];

const faqs = [
  {
    question: 'Can I cancel my membership anytime?',
    answer: 'Yes. We offer month-to-month memberships with no long-term contracts. Cancel anytime with 30 days notice.',
  },
  {
    question: 'Is there a joining fee?',
    answer: 'There is a one-time GH₵250 registration fee. That is the only upfront payment, and your first 30 days are free.',
  },
  {
    question: 'How does the free first month work?',
    answer: 'Pay GH₵250 to register once and receive full gym access for your first 30 days at no extra cost. After that, your chosen plan (GH₵200/month, GH₵500/quarter, or GH₵2,200/year) begins. You can renew from your member dashboard or at the front desk.',
  },
  {
    question: 'Can I freeze my membership?',
    answer: 'Yes, you can freeze for up to 3 months per year for a small administrative fee of GH₵50/month.',
  },
  {
    question: 'Do you offer student or senior discounts?',
    answer: 'Yes! Students with valid ID and seniors (60+) receive 15% off any membership plan.',
  },
  {
    question: 'What if I want to switch plans?',
    answer: 'Upgrade or downgrade anytime. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'Is there a trial period?',
    answer: 'Yes. Your first month serves as the trial period. You receive 30 free days of gym access before your plan charges begin.',
  },
];

export default function MembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [_gymStats, setGymStats] = useState<GymStats | null>(null);
  const [_successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [_featuredBenefits, setFeaturedBenefits] = useState<FeaturedBenefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlansData = async () => {
      try {
        const response = await fetch('/api/public/plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
          setGymStats(data.gymStats || null);
          setSuccessStories(data.successStories || []);
          setFeaturedBenefits(data.featuredBenefits || []);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlansData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Membership"
        title="Choose Your Plan"
        description="Simple, flexible plans with no hidden fees and no long-term contracts. Start training today."
        backgroundImage="/images/strength.jpg"
      />

      {/* Plans Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Membership <span className="text-orange-500">Plans</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6" />
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every plan includes access to all facilities and group classes. Pick the duration that works for you.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
              <p className="mt-4 text-gray-600">Loading plans...</p>
            </div>
          ) : plans.length > 0 ? (
            <PlanComparison
              plans={plans}
              showAllFeatures={false}
              highlightPopular={true}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Plans are being updated. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Member Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Every Membership <span className="text-orange-500">Includes</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              No matter which plan you choose, you get all of this at no extra cost.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start space-x-4 p-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Wellness */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <TrendingUp className="w-10 h-10 text-orange-500 mb-4" />
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                Corporate <span className="text-orange-500">Wellness</span>
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Invest in your team&apos;s health. Healthier employees mean higher productivity,
                lower absenteeism, and a stronger company culture.
              </p>
              <ul className="space-y-3 mb-8">
                {corporateFeatures.map((feature) => (
                  <li key={feature} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  Request a Corporate Quote
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white border-gray-200 p-6 text-center">
                  <div className="text-3xl font-black text-orange-500 mb-1">25%</div>
                  <div className="text-sm text-gray-600">Productivity Increase</div>
                </Card>
                <Card className="bg-white border-gray-200 p-6 text-center">
                  <div className="text-3xl font-black text-orange-500 mb-1">40%</div>
                  <div className="text-sm text-gray-600">Fewer Sick Days</div>
                </Card>
                <Card className="bg-white border-gray-200 p-6 text-center">
                  <div className="text-3xl font-black text-orange-500 mb-1">90%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </Card>
                <Card className="bg-white border-gray-200 p-6 text-center">
                  <div className="text-3xl font-black text-orange-500 mb-1">50+</div>
                  <div className="text-sm text-gray-600">Partner Companies</div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Questions? <span className="text-orange-500">Answers.</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <p className="text-gray-500 mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                Contact Us
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Start Your Transformation
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join 2,500+ members who chose to invest in their health.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  Join Now
                </Button>
              </Link>
              <Link href="/classes">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-white/10 text-lg px-8 py-6">
                  View Classes
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
