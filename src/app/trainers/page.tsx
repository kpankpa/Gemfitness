'use client';

import { motion } from 'framer-motion';
import { Award, Users, Target, Star, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const trainers = [
  {
    name: 'Kwame Mensah',
    role: 'Head Strength Coach',
    specialty: 'Strength & Powerlifting',
    bio: '10+ years of experience building raw strength. Former national powerlifting champion.',
    available: 'Mon, Wed, Fri',
  },
  {
    name: 'Sarah Johnson',
    role: 'Yoga & Wellness Expert',
    specialty: 'Yoga, Pilates & Mindfulness',
    bio: 'Certified in multiple yoga styles. Brings holistic wellness through movement and breathwork.',
    available: 'Tue, Thu, Sat',
  },
  {
    name: 'Mike Chen',
    role: 'HIIT Specialist',
    specialty: 'HIIT & Athletic Performance',
    bio: 'Former CrossFit athlete. Pushes you to discover your peak performance safely and effectively.',
    available: 'Mon–Fri',
  },
  {
    name: 'Marcus Williams',
    role: 'Boxing Coach',
    specialty: 'Boxing & Kickboxing',
    bio: 'Former professional boxer (15-2 record). Combines technique with explosive conditioning.',
    available: 'Mon, Wed, Fri',
  },
  {
    name: 'Ama Osei',
    role: 'Nutrition Coach',
    specialty: 'Nutrition & Weight Management',
    bio: 'Registered dietitian who helps clients build sustainable nutrition habits for lasting results.',
    available: 'Mon–Thu',
  },
  {
    name: 'David Appiah',
    role: 'Rehabilitation Specialist',
    specialty: 'Injury Prevention & Recovery',
    bio: 'Physical therapist who specializes in getting athletes back to peak performance after injury.',
    available: 'Tue, Thu, Sat',
  },
];

const whyUs = [
  'Average 8+ years coaching experience',
  'Continuing education required annually',
  'Specialized in multiple training modalities',
  'Proven track record of client success',
  'Background-checked and fully insured',
];

export default function TrainersPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Personal Training"
        title="Meet Your Coaches"
        description="Certified experts dedicated to helping you reach your goals — faster, safer, and with more confidence."
      />

      {/* Why Personal Training */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                Results Come <span className="text-orange-500">Faster</span> with a Coach
              </h2>
              <div className="w-24 h-1 bg-orange-500 mb-6" />
              <p className="text-lg text-gray-700 mb-6">
                A personal trainer doesn&apos;t just count reps — they build a program around your body,
                your goals, and your lifestyle. Every session is designed to challenge you and move you forward.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-black text-orange-500 mb-1">3x</div>
                  <div className="text-sm text-gray-600">Faster Results</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-black text-orange-500 mb-1">87%</div>
                  <div className="text-sm text-gray-600">Goal Achievement Rate</div>
                </div>
              </div>
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  Book a Free Consultation <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gray-900 p-8 border-0">
                <Award className="w-10 h-10 text-orange-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-6">Why Choose Our Trainers</h3>
                <ul className="space-y-4">
                  {whyUs.map((point) => (
                    <li key={point} className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Our <span className="text-orange-500">Expert Team</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each trainer is certified, experienced, and committed to your success.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((trainer, index) => (
              <motion.div
                key={trainer.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500 transition-all duration-300 h-full group">
                  {/* Avatar placeholder */}
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Users className="w-16 h-16 text-gray-300" />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                      {trainer.name}
                    </h3>
                    <p className="text-orange-500 font-semibold text-sm mb-3">{trainer.role}</p>

                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                      <Star className="w-4 h-4 text-orange-500" />
                      <span>{trainer.specialty}</span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{trainer.bio}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        <span>{trainer.available}</span>
                      </div>
                      <Link href="/contact">
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                          Book Session
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Philosophy */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Our <span className="text-orange-500">Approach</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Personalized',
                description: 'Programs built around your body, goals, and schedule.',
              },
              {
                icon: Award,
                title: 'Science-Based',
                description: 'Training grounded in exercise science and proven methods.',
              },
              {
                icon: Star,
                title: 'Sustainable',
                description: 'Long-term habits, not quick fixes. Real results that last.',
              },
              {
                icon: Users,
                title: 'Supportive',
                description: 'Nutrition guidance, accountability, and constant motivation.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
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
              Not Ready for 1-on-1?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Our group classes offer expert coaching in a motivating community setting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/classes">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  View Class Schedule
                </Button>
              </Link>
              <Link href="/membership">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-white/10 text-lg px-8 py-6">
                  Explore Membership
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
