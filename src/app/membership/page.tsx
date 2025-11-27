'use client';

import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Star,
  Users,
  Clock,
  Dumbbell,
  Heart,
  Zap,
  Gift,
  Sparkles,
  Calendar,
  Crown,
  TrendingUp,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

const membershipPlans = [
  {
    name: 'Monthly',
    price: 'GH₵200',
    period: 'month',
    description: 'Perfect for getting started on your fitness journey',
    features: [
      { name: 'Full gym access', included: true },
      { name: 'All equipment', included: true },
      { name: 'Group classes', included: true },
      { name: 'Locker room & showers', included: true },
      { name: 'Free fitness assessment', included: true },
      { name: 'Priority booking', included: false },
      { name: 'Personal training sessions', included: false },
      { name: '24/7 access', included: false },
      { name: 'Nutrition consultation', included: false },
      { name: 'Free merchandise', included: false },
    ],
    color: 'from-gray-500 to-gray-600',
    icon: Dumbbell,
    popular: false,
  },
  {
    name: 'Quarterly',
    price: 'GH₵500',
    period: '3 months',
    description: 'Our most popular plan - Save GH₵100!',
    features: [
      { name: 'Everything in Monthly', included: true },
      { name: 'Priority booking', included: true },
      { name: '1 free personal training session', included: true },
      { name: 'Nutrition consultation', included: true },
      { name: 'Progress tracking', included: true },
      { name: 'Towel service', included: true },
      { name: 'Member events access', included: true },
      { name: 'Free guest passes (2/quarter)', included: true },
      { name: 'Mobile app access', included: true },
      { name: '10% merchandise discount', included: true },
    ],
    color: 'from-orange-500 to-orange-600',
    icon: Star,
    popular: true,
  },
  {
    name: 'Annual',
    price: 'GH₵2,200',
    period: 'year',
    description: 'Ultimate value - Save GH₵200!',
    features: [
      { name: 'Everything in Quarterly', included: true },
      { name: 'Unlimited personal training', included: true },
      { name: 'Monthly nutrition plan & tracking', included: true },
      { name: 'Exclusive member events', included: true },
      { name: 'Bring-a-friend days', included: true },
      { name: 'Free merchandise', included: true },
      { name: 'Priority equipment access', included: true },
      { name: 'Complimentary sports massage (quarterly)', included: true },
      { name: 'VIP support', included: true },
      { name: 'Free guest passes (unlimited)', included: true },
    ],
    color: 'from-purple-500 to-pink-500',
    icon: Crown,
    popular: false,
  },
];

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {membershipPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
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
                  y: -12,
                  transition: { duration: 0.3 }
                }}
                className={`relative ${plan.popular ? 'lg:-mt-8' : ''}`}
              >
                {plan.popular && (
                  <>
                    {/* Animated Badge - Floating Above Card */}
                    <motion.div 
                      className="absolute -top-5 left-1/2 -translate-x-1/2 z-20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white text-sm font-bold px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg animate-pulse">
                        <Sparkles className="w-4 h-4" />
                        <span>Most Popular</span>
                      </div>
                    </motion.div>
                  </>
                )}

                <Card
                  className={`relative bg-white border-2 transition-all duration-500 h-full group overflow-hidden ${
                    plan.popular 
                      ? 'border-orange-500 shadow-2xl shadow-orange-500/30 lg:scale-105' 
                      : 'border-gray-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/20'
                  }`}
                >
                  {/* Gradient Background Effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    plan.popular 
                      ? 'bg-gradient-to-br from-orange-50 via-white to-orange-50' 
                      : 'bg-gradient-to-br from-orange-50/50 via-white to-white'
                  }`} />

                  {plan.popular && (
                    <>
                      {/* Corner Accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full" />
                    </>
                  )}

                  <div className="p-8 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <motion.div 
                        className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <plan.icon className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                      <div className="mb-2 relative">
                        <motion.div
                          initial={{ scale: 0.9 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <span className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                            {plan.price}
                          </span>
                          <span className="text-gray-600 text-lg">/{plan.period}</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent mb-6" />

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <motion.li 
                          key={feature.name} 
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + (i * 0.05) }}
                        >
                          {feature.included ? (
                            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-orange-600" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <X className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                          <span className={`text-sm ${feature.included ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                            {feature.name}
                          </span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link href={`/signup?plan=${plan.name.toLowerCase()}`}>
                        <Button
                          className={`w-full text-lg py-6 font-semibold shadow-lg transition-all duration-300 ${
                            plan.popular
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/50'
                              : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-orange-500 hover:to-orange-600 text-white hover:shadow-orange-500/50'
                          }`}
                        >
                          Join Now
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
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
              Need a custom plan? <Link href="/contact" className="text-orange-500 hover:underline">Contact us</Link> for corporate or group memberships.
            </p>
          </motion.div>
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

