'use client';

import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Dumbbell, Heart, Users, Flame, Zap, Wind, Target, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const classTypes = [
  {
    icon: Dumbbell,
    title: 'Strength Training',
    description: 'Build muscle and increase power with our comprehensive strength programs.',
    features: ['Free Weights', 'Resistance Machines', 'Powerlifting', 'Functional Training'],
    schedule: 'Mon, Wed, Fri - 6:00 AM, 12:00 PM, 6:00 PM',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Heart,
    title: 'Cardio & Conditioning',
    description: 'Boost your endurance and cardiovascular health with dynamic cardio workouts.',
    features: ['Treadmill Training', 'Cycling', 'Rowing', 'Sprint Intervals'],
    schedule: 'Daily - 7:00 AM, 1:00 PM, 5:00 PM',
    color: 'from-red-500 to-pink-500',
  },
  {
    icon: Wind,
    title: 'Yoga & Flexibility',
    description: 'Improve flexibility, balance, and mental clarity through mindful movement.',
    features: ['Vinyasa Flow', 'Power Yoga', 'Yin Yoga', 'Meditation'],
    schedule: 'Tue, Thu, Sat - 7:00 AM, 5:30 PM',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Target,
    title: 'Boxing & Combat',
    description: 'Channel your energy into powerful punches and defensive techniques.',
    features: ['Heavy Bag', 'Speed Drills', 'Sparring', 'Cardio Boxing'],
    schedule: 'Mon, Wed, Fri - 5:00 PM, 7:00 PM',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Dance Fitness',
    description: 'Burn calories while having fun with high-energy dance-based workouts.',
    features: ['Zumba', 'Hip Hop', 'Afrobeats', 'Cardio Dance'],
    schedule: 'Tue, Thu, Sat - 6:00 PM, 7:30 PM',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Flame,
    title: 'HIIT & Bootcamp',
    description: 'Maximum results in minimum time with intense interval training.',
    features: ['Circuit Training', 'Tabata', 'Metabolic Conditioning', 'Team Challenges'],
    schedule: 'Mon-Fri - 6:00 AM, 12:00 PM, 6:00 PM',
    color: 'from-orange-500 to-yellow-500',
  },
];

const weeklySchedule = [
  { day: 'Monday', classes: [
    { time: '6:00 AM', name: 'Strength Training', instructor: 'Kwame Mensah' },
    { time: '7:00 AM', name: 'Cardio Blast', instructor: 'Sarah Johnson' },
    { time: '12:00 PM', name: 'HIIT Bootcamp', instructor: 'Mike Chen' },
    { time: '5:00 PM', name: 'Boxing Fundamentals', instructor: 'Marcus Williams' },
    { time: '6:00 PM', name: 'Power Training', instructor: 'Kwame Mensah' },
  ]},
  { day: 'Tuesday', classes: [
    { time: '7:00 AM', name: 'Yoga Flow', instructor: 'Sarah Johnson' },
    { time: '12:00 PM', name: 'HIIT Circuit', instructor: 'Mike Chen' },
    { time: '6:00 PM', name: 'Dance Fitness', instructor: 'Sarah Johnson' },
    { time: '7:30 PM', name: 'Zumba Party', instructor: 'Sarah Johnson' },
  ]},
  { day: 'Wednesday', classes: [
    { time: '6:00 AM', name: 'Strength & Conditioning', instructor: 'Marcus Williams' },
    { time: '7:00 AM', name: 'Cardio Mix', instructor: 'Mike Chen' },
    { time: '12:00 PM', name: 'HIIT Express', instructor: 'Kwame Mensah' },
    { time: '5:00 PM', name: 'Combat Training', instructor: 'Marcus Williams' },
  ]},
  { day: 'Thursday', classes: [
    { time: '7:00 AM', name: 'Power Yoga', instructor: 'Sarah Johnson' },
    { time: '12:00 PM', name: 'Bootcamp', instructor: 'Mike Chen' },
    { time: '5:30 PM', name: 'Yin Yoga', instructor: 'Sarah Johnson' },
    { time: '6:00 PM', name: 'Hip Hop Dance', instructor: 'Sarah Johnson' },
  ]},
  { day: 'Friday', classes: [
    { time: '6:00 AM', name: 'Full Body Strength', instructor: 'Kwame Mensah' },
    { time: '7:00 AM', name: 'Cardio Intervals', instructor: 'Mike Chen' },
    { time: '12:00 PM', name: 'HIIT & Core', instructor: 'Marcus Williams' },
    { time: '6:00 PM', name: 'Friday Burnout', instructor: 'Mike Chen' },
  ]},
  { day: 'Saturday', classes: [
    { time: '7:00 AM', name: 'Weekend Warrior Yoga', instructor: 'Sarah Johnson' },
    { time: '9:00 AM', name: 'Group Bootcamp', instructor: 'All Trainers' },
    { time: '6:00 PM', name: 'Afrobeats Dance', instructor: 'Sarah Johnson' },
  ]},
];

const pricingOptions = [
  {
    title: 'Class Pack',
    price: 'GH₵150',
    period: '10 Classes',
    features: [
      'Valid for 3 months',
      'Book any class',
      'Cancel anytime',
      'Guest pass included',
    ],
  },
  {
    title: 'Monthly Unlimited',
    price: 'GH₵200',
    period: 'Per Month',
    popular: true,
    features: [
      'Unlimited class access',
      'All class types',
      'Priority booking',
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classTypes.map((classType, index) => (
              <motion.div
                key={classType.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-2 border-gray-100 hover:border-orange-500 transition-all duration-300 h-full group cursor-pointer hover:shadow-lg">
                  <div className="p-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${classType.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <classType.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                      {classType.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {classType.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      {classType.features.map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-start space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>{classType.schedule}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
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

