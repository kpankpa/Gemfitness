'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Star,
  Users,
  Clock,
  Heart,
  Zap,
  Gift,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import PlanComparison from '@/components/PlanComparison';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Plan, GymStats, SuccessStory, FeaturedBenefit } from '@/types';

const memberPerks = [
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Open early mornings to late nights, 7 days a week',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Join a motivated community of fitness enthusiasts',
  },
  {
    icon: Heart,
    title: 'Expert Support',
    description: 'Access to certified trainers and wellness coaches',
  },
  {
    icon: Zap,
    title: 'Modern Equipment',
    description: 'State-of-the-art machines maintained weekly',
  },
  {
    icon: Calendar,
    title: 'Member Events',
    description: 'Exclusive workshops, challenges, and social events',
  },
  {
    icon: Shield,
    title: 'Safe Environment',
    description: 'Clean, sanitized, and secure facility',
  },
];

const corporateFeatures = [
  'Discounted group rates',
  'Flexible billing options',
  'Dedicated account manager',
  'Custom wellness programs',
  'On-site fitness assessments',
  'Quarterly health workshops',
];

const faqs = [
  {
    question: 'Can I cancel my membership anytime?',
    answer: 'Yes! We offer month-to-month memberships with no long-term contracts. Cancel anytime with 30 days notice.',
  },
  {
    question: 'Is there a joining fee?',
    answer: 'No joining fees! We occasionally waive sign-up costs during promotional periods.',
  },
  {
    question: 'Can I freeze my membership?',
    answer: 'Yes, you can freeze your membership for up to 3 months per year for a small administrative fee of GH₵50/month.',
  },
  {
    question: 'Do you offer student or senior discounts?',
    answer: 'Yes! Students with valid ID and seniors (60+) receive 15% off any membership plan.',
  },
  {
    question: 'What if I want to switch plans?',
    answer: 'You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'Is there a trial period?',
    answer: 'We offer flexible membership options to suit your needs. Visit us to learn more about getting started.',
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
        description="Flexible membership options designed to fit your lifestyle and goals. No hidden fees, no long-term contracts."
      />

      {/* Membership Offer Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center space-x-4">
              <Gift className="w-12 h-12 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Choose Your Plan Today!</h3>
                <p className="text-gray-700">Start your fitness journey with flexible membership options.</p>
              </div>
            </div>
            <Link href="/signup?plan=quarterly">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6 whitespace-nowrap">
                Join Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Membership <span className="text-orange-500">Plans</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your goals and budget. All plans include access to our world-class facilities.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="mt-4 text-gray-600">Loading membership plans...</p>
            </div>
          ) : plans.length > 0 ? (
            <PlanComparison 
              plans={plans}
              showAllFeatures={false}
              highlightPopular={true}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No membership plans available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Member Perks */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Member <span className="text-orange-500">Perks</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every membership includes these amazing benefits at no extra cost.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {memberPerks.map((perk, index) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 p-6 hover:border-orange-500/30 transition-all h-full">
                  <perk.icon className="w-12 h-12 text-orange-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{perk.title}</h3>
                  <p className="text-gray-600">{perk.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Packages */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Users className="w-8 h-8 text-orange-500" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Corporate <span className="text-orange-500">Wellness</span>
                </h2>
              </div>
              <p className="text-xl text-gray-700 mb-6">
                Invest in your team&apos;s health and productivity with our corporate membership packages.
              </p>
              <p className="text-gray-600 mb-8">
                We offer customized wellness programs designed for businesses of all sizes. Boost morale, reduce sick days, and create a healthier workplace culture.
              </p>
              <ul className="space-y-3">
                {corporateFeatures.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/contact">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6">
                    Request Corporate Quote
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-orange-500/20 to-transparent border-orange-500/30 p-8">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-orange-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Corporate Benefits</h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-4xl font-bold text-orange-500 mb-2">25%</div>
                      <div className="text-sm text-gray-700">Average productivity increase</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-orange-500 mb-2">40%</div>
                      <div className="text-sm text-gray-700">Reduction in sick days</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-orange-500 mb-2">90%</div>
                      <div className="text-sm text-gray-700">Employee satisfaction rate</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-orange-500 mb-2">50+</div>
                      <div className="text-sm text-gray-700">Partner companies</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm italic">
                    &quot;Investing in employee fitness was one of the best decisions we made. Team morale and productivity soared!&quot;
                    <br />
                    <span className="text-gray-500">- CEO, Tech Company Ghana</span>
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="text-orange-500">Questions</span>
            </h2>
            <p className="text-gray-600">
              Got questions? We&apos;ve got answers.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white border-gray-200 p-6 hover:border-orange-500/30 transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-4">
              Still have questions?
            </p>
            <Link href="/contact">
              <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                Contact Support
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Star className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Life?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Join hundreds of members who are already crushing their fitness goals at GemFitness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?plan=quarterly">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6">
                  Join Now
                </Button>
              </Link>
              <Link href="/classes">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-6">
                  View Class Schedule
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

