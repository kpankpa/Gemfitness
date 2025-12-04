'use client';

import { useState, useEffect } from 'react';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Dumbbell, Heart, Users, Flame, Zap, Wind, Target, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
  description?: string;
  type: string;
  instructor: string;
  duration: number;
  maxCapacity: number;
  enrolled: number;
  schedule: string;
  status: string;
}

const weeklySchedule = [
  { day: 'Monday', classes: [
    { time: '6:30 AM', name: 'Early Birds Class', instructor: 'GemFitness Team' },
    { time: '5:30 AM - 7:00 AM', name: 'Regular Session 1', instructor: 'GemFitness Team' },
    { time: '7:00 AM - 9:00 AM', name: 'DM Class (with stepboard)', instructor: 'GemFitness Team' },
    { time: '7:00 PM - 8:30 PM', name: 'Regular Session 2', instructor: 'GemFitness Team' },
  ]},
  { day: 'Tuesday', classes: [
    { time: '6:30 AM', name: 'Early Birds Class', instructor: 'GemFitness Team' },
    { time: '5:30 AM - 7:00 AM', name: 'Regular Session 1', instructor: 'GemFitness Team' },
    { time: '7:00 AM - 9:00 AM', name: 'DM Class (with stepboard)', instructor: 'GemFitness Team' },
    { time: '7:00 PM - 8:30 PM', name: 'Regular Session 2', instructor: 'GemFitness Team' },
  ]},
  { day: 'Wednesday', classes: [
    { time: '6:30 AM', name: 'Early Birds Class', instructor: 'GemFitness Team' },
    { time: '5:30 AM - 7:00 AM', name: 'Regular Session 1', instructor: 'GemFitness Team' },
    { time: '7:00 AM - 9:00 AM', name: 'DM Class (with stepboard)', instructor: 'GemFitness Team' },
    { time: '7:00 PM - 8:30 PM', name: 'Regular Session 2', instructor: 'GemFitness Team' },
  ]},
  { day: 'Thursday', classes: [
    { time: '6:30 AM', name: 'Early Birds Class', instructor: 'GemFitness Team' },
    { time: '5:30 AM - 7:00 AM', name: 'Regular Session 1', instructor: 'GemFitness Team' },
    { time: '7:00 AM - 9:00 AM', name: 'DM Class (with stepboard)', instructor: 'GemFitness Team' },
    { time: '7:00 PM - 8:30 PM', name: 'Regular Session 2', instructor: 'GemFitness Team' },
  ]},
  { day: 'Friday', classes: [
    { time: '6:30 AM', name: 'Early Birds Class', instructor: 'GemFitness Team' },
    { time: '5:30 AM - 7:00 AM', name: 'Regular Session 1', instructor: 'GemFitness Team' },
    { time: '7:00 AM - 9:00 AM', name: 'DM Class (with stepboard)', instructor: 'GemFitness Team' },
    { time: '7:00 PM - 8:30 PM', name: 'Regular Session 2', instructor: 'GemFitness Team' },
  ]},
  { day: 'Saturday', classes: [
    { time: '6:00 AM - 8:00 AM', name: 'Saturday Session', instructor: 'GemFitness Team' },
  ]},
];

const pricingOptions = [
  {
    title: 'Early Birds Class',
    price: 'GH₵50',
    period: 'Per Session',
    features: [
      'Mon-Fri at 6:30 AM',
      'Limited spots available',
      'High energy start',
      'Community atmosphere',
    ],
  },
  {
    title: 'Regular Class',
    price: 'GH₵35',
    period: 'Per Session',
    popular: true,
    features: [
      'Mon-Fri: 5:30 AM - 7:00 AM',
      'OR 7:00 PM - 8:30 PM',
      'Flexible timing options',
      'All fitness levels welcome',
    ],
  },
  {
    title: 'Double Session',
    price: 'GH₵50',
    period: 'Both Sessions',
    features: [
      'Morning & Evening',
      '5:30 AM - 7:00 AM',
      '& 7:00 PM - 8:30 PM',
      'Maximum results',
    ],
  },
  {
    title: 'DM Class',
    price: 'GH₵50',
    period: 'Per Session',
    features: [
      'Mon-Fri: 7:00 AM - 9:00 AM',
      'Includes stepboard',
      'Specialized training',
      'Advanced techniques',
    ],
  },
  {
    title: 'Saturday Session',
    price: 'GH₵150',
    period: 'Per Person',
    features: [
      '6:00 AM - 8:00 AM',
      'Gate entrance fee',
      'Weekend intensive',
      'Full gym access',
    ],
  },
  {
    title: 'Major Events',
    price: 'GH₵250',
    period: 'Per Person',
    features: [
      'Special fitness events',
      'Gate entrance fee',
      'Exclusive sessions',
      'Community gatherings',
      'Free guest passes (2/month)',
      'Nutrition consultation',
    ],
  },
  {
    title: 'Annual Membership',
    price: 'GH₵2,200',
    period: 'Per Year',
    features: [
      'Unlimited classes',
      'All facilities access',
      '24/7 gym access',
      'Personal trainer sessions (4/year)',
      'Priority booking',
      'Free merchandise',
    ],
  },
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes?status=ACTIVE');
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
    const typeMap: { [key: string]: any } = {
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
        description="From strength training to dance fitness, discover classes designed to help you reach your goals and have fun doing it."
      />

      {/* Class Types Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Our <span className="text-orange-500">Class Types</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Every workout is expertly designed to challenge you, motivate you, and deliver real results.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">Loading classes...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No classes available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {classes.map((classItem, index) => {
                const IconComponent = getIconForType(classItem.type);
                const colorClass = 'from-orange-500 to-red-500';
                
                return (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white border-2 border-gray-100 hover:border-orange-500 transition-all duration-300 h-full group cursor-pointer hover:shadow-lg">
                      <div className="p-6">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                          {classItem.name}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {classItem.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">Type: {classItem.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">Max capacity: {classItem.maxCapacity}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">Duration: {classItem.duration} minutes</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-start space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{classItem.schedule}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Schedule Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Weekly <span className="text-orange-500">Schedule</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Plan your week ahead. All times are in GMT. Book your spot early!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {weeklySchedule.map((daySchedule, index) => (
              <motion.div
                key={daySchedule.day}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/30 transition-all">
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      {daySchedule.day}
                    </h3>
                    <div className="space-y-3">
                      {daySchedule.classes.map((classItem) => (
                        <div
                          key={`${classItem.time}-${classItem.name}`}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-orange-500 font-semibold text-sm whitespace-nowrap">
                            {classItem.time}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">{classItem.name}</div>
                            <div className="text-sm text-gray-600">{classItem.instructor}</div>
                          </div>
                        </div>
                      ))}
                    </div>
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
              Schedule subject to change. Check our app for real-time updates.
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Download Class Schedule (PDF)
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Class <span className="text-orange-500">Pricing</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Flexible options to fit your schedule and budget. All memberships include full gym access.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingOptions.map((plan, index) => (
              <motion.div
                key={plan.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative bg-white border-gray-200 hover:border-orange-500/50 transition-all h-full ${
                  plan.popular ? 'border-orange-500 shadow-lg shadow-orange-500/20' : ''
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-orange-500">{plan.price}</span>
                      <span className="text-gray-600 ml-2">/ {plan.period}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/membership">
                      <Button className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                          : 'bg-gray-50 hover:bg-white/20 text-white'
                      }`}>
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
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
              Not sure which option is right for you?
            </p>
            <Link href="/contact">
              <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                Contact Us for Advice
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Start Your Fitness Journey?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Join our community of fitness enthusiasts today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/membership">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6">
                  View Membership Plans
                </Button>
              </Link>
              <Link href="/trainers">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-6">
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

