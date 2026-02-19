'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Heart, Users, Flame, Zap, Target, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PublicClass {
  id: string;
  name: string;
  description?: string;
  type: string;
  schedule: string;
  duration: number;
}

const weeklySchedule = [
  { day: 'Monday', classes: [
    { time: '5:30 AM', name: 'Early Birds Class' },
    { time: '5:30 - 7:00 AM', name: 'Regular Session' },
    { time: '7:00 - 9:00 AM', name: 'DM Class (Stepboard)' },
    { time: '7:00 - 8:30 PM', name: 'Evening Session' },
  ]},
  { day: 'Tuesday', classes: [
    { time: '5:30 AM', name: 'Early Birds Class' },
    { time: '5:30 - 7:00 AM', name: 'Regular Session' },
    { time: '7:00 - 9:00 AM', name: 'DM Class (Stepboard)' },
    { time: '7:00 - 8:30 PM', name: 'Evening Session' },
  ]},
  { day: 'Wednesday', classes: [
    { time: '5:30 AM', name: 'Early Birds Class' },
    { time: '5:30 - 7:00 AM', name: 'Regular Session' },
    { time: '7:00 - 9:00 AM', name: 'DM Class (Stepboard)' },
    { time: '7:00 - 8:30 PM', name: 'Evening Session' },
  ]},
  { day: 'Thursday', classes: [
    { time: '5:30 AM', name: 'Early Birds Class' },
    { time: '5:30 - 7:00 AM', name: 'Regular Session' },
    { time: '7:00 - 9:00 AM', name: 'DM Class (Stepboard)' },
    { time: '7:00 - 8:30 PM', name: 'Evening Session' },
  ]},
  { day: 'Friday', classes: [
    { time: '5:30 AM', name: 'Early Birds Class' },
    { time: '5:30 - 7:00 AM', name: 'Regular Session' },
    { time: '7:00 - 9:00 AM', name: 'DM Class (Stepboard)' },
    { time: '7:00 - 8:30 PM', name: 'Evening Session' },
  ]},
  { day: 'Saturday', classes: [
    { time: '6:00 - 8:00 AM', name: 'Saturday Special' },
  ]},
];

const pricingOptions = [
  {
    title: 'Early Birds',
    price: 'GH₵50',
    period: 'per session',
    description: 'Start your day right with our 5:30 AM class.',
    features: ['Mon–Fri at 5:30 AM', 'Limited spots', 'High energy start'],
  },
  {
    title: 'Regular Session',
    price: 'GH₵35',
    period: 'per session',
    popular: true,
    description: 'Our most flexible option — morning or evening.',
    features: ['Morning: 5:30–7:00 AM', 'Evening: 7:00–8:30 PM', 'All fitness levels'],
  },
  {
    title: 'Double Session',
    price: 'GH₵50',
    period: 'both sessions',
    description: 'Train twice a day for maximum results.',
    features: ['Morning + Evening', 'Best value per session', 'Serious commitment'],
  },
  {
    title: 'DM Class',
    price: 'GH₵50',
    period: 'per session',
    description: 'Advanced stepboard training for targeted results.',
    features: ['Mon–Fri: 7:00–9:00 AM', 'Includes stepboard', 'Specialized training'],
  },
  {
    title: 'Saturday Special',
    price: 'GH₵150',
    period: 'per person',
    description: 'Weekend intensive for an extra challenge.',
    features: ['6:00–8:00 AM', 'Full gym access', 'Weekend community vibe'],
  },
  {
    title: 'Annual Pass',
    price: 'GH₵2,200',
    period: 'per year',
    description: 'Unlimited access to everything GemFitness offers.',
    features: ['Unlimited classes', 'All facilities', 'Priority booking'],
  },
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<PublicClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/public/classes?limit=12');
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      } else {
        setError('Failed to load classes');
      }
    } catch (err) {
      setError('Unable to fetch classes');
      console.error('Error fetching classes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    const typeMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'Cardio': Heart,
      'HIIT': Flame,
      'Strength': Dumbbell,
      'Stepboard': Target,
      'Dance': Users,
      'Core': Zap,
    };
    return typeMap[type] || Dumbbell;
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Our Classes"
        title="Find Your Perfect Workout"
        description="From strength training to dance fitness — classes designed to challenge you, motivate you, and deliver real results."
      />

      {/* Class Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Explore Our <span className="text-orange-500">Classes</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6" />
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Every class is led by certified instructors who know how to push you and keep it fun.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
              <p className="mt-4 text-gray-600">Loading classes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No classes available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem, index) => {
                const IconComponent = getIconForType(classItem.type);
                return (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white border-gray-200 hover:border-orange-500 transition-all duration-300 h-full group">
                      <div className="p-6">
                        <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                          <IconComponent className="w-7 h-7 text-orange-500 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                          {classItem.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {classItem.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>{classItem.duration} min</span>
                          </div>
                          <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs font-medium">
                            {classItem.type}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Weekly Schedule */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Weekly <span className="text-orange-500">Schedule</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Plan your week ahead. All times are in GMT.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklySchedule.map((daySchedule, index) => (
              <motion.div
                key={daySchedule.day}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/30 transition-all">
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                      {daySchedule.day}
                    </h3>
                    <div className="space-y-2">
                      {daySchedule.classes.map((classItem) => (
                        <div
                          key={classItem.time}
                          className="flex items-center space-x-3 text-sm"
                        >
                          <span className="text-orange-500 font-semibold w-28 flex-shrink-0">
                            {classItem.time}
                          </span>
                          <span className="text-gray-700">{classItem.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Simple <span className="text-orange-500">Pricing</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              No hidden fees. Choose the option that fits your schedule and budget.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingOptions.map((plan, index) => (
              <motion.div
                key={plan.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative bg-white h-full ${
                  plan.popular ? 'border-orange-500 border-2' : 'border-gray-200'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-black text-orange-500">{plan.price}</span>
                      <span className="text-gray-500 ml-1 text-sm">/ {plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/membership">
                      <Button className={`w-full ${
                        plan.popular
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-gray-100 hover:bg-orange-500 text-gray-900 hover:text-white'
                      } transition-colors`}>
                        Get Started <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Ready to Start?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join our community and find the class that works for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  Sign Up Now
                </Button>
              </Link>
              <Link href="/trainers">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-white/10 text-lg px-8 py-6">
                  Meet Our Trainers
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
