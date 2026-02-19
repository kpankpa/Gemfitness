'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  Target,
  Users,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const values = [
  {
    icon: Heart,
    title: 'Community First',
    description: 'A supportive environment where everyone belongs.',
  },
  {
    icon: Target,
    title: 'Excellence',
    description: 'The highest standards in coaching and equipment.',
  },
  {
    icon: Users,
    title: 'Inclusivity',
    description: 'All ages, all levels, all backgrounds — welcome here.',
  },
  {
    icon: TrendingUp,
    title: 'Results-Driven',
    description: 'We measure success by your progress.',
  },
  {
    icon: Sparkles,
    title: 'Passion',
    description: "We love what we do. You'll feel it in every class.",
  },
  {
    icon: Star,
    title: 'Integrity',
    description: 'Honest, transparent, and always in your corner.',
  },
];

const timeline = [
  {
    year: '2015',
    title: 'The Beginning',
    description: 'GemFitness opened its doors in Tema Gbestile with a simple mission: make fitness accessible.',
  },
  {
    year: '2017',
    title: 'Expanding the Vision',
    description: 'Doubled our space and launched group fitness studios to meet growing demand.',
  },
  {
    year: '2019',
    title: '1,000 Members Strong',
    description: "Reached our first major membership milestone as Tema's fastest-growing gym.",
  },
  {
    year: '2021',
    title: 'Next-Level Equipment',
    description: 'Major investment in premium equipment and full facility renovation.',
  },
  {
    year: '2023',
    title: 'Award-Winning',
    description: 'Named "Best Gym in Greater Accra Region" by Ghana Fitness Awards.',
  },
  {
    year: '2024',
    title: 'Stronger Than Ever',
    description: '2,500+ active members, 50+ weekly classes, and still growing every day.',
  },
];

const stats = [
  { number: '2,500+', label: 'Active Members' },
  { number: '50+', label: 'Weekly Classes' },
  { number: '15+', label: 'Expert Trainers' },
  { number: '9', label: 'Years Strong' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="About Us"
        title="Our Story"
        description="From a single room in 2015 to Tema's premier fitness destination — this is who we are."
      />

      {/* Purpose Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              We believe fitness changes <span className="text-orange-500">everything.</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-8" />
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              At GemFitness, we&apos;re more than a gym. We&apos;re a community built on the belief that when
              you invest in your health, every part of your life gets better — your confidence, your energy,
              your relationships, and your future.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Whether you&apos;re stepping into a gym for the first time or training for your next competition,
              GemFitness is where you belong. Our certified coaches, world-class equipment, and welcoming
              community make sure you never work out alone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-black text-orange-500 mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              What We <span className="text-orange-500">Stand For</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These values guide every decision we make — from how we train to how we treat our community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start space-x-4 p-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{value.title}</h3>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Our <span className="text-orange-500">Journey</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From humble beginnings to Tema&apos;s most trusted fitness brand.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-500/50 to-transparent" />

            <div className="space-y-6">
              {timeline.map((event, index) => (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20"
                >
                  <div className="absolute left-5 top-1 w-6 h-6 bg-orange-500 rounded-full border-4 border-white shadow-sm" />

                  <div className="pb-2">
                    <div className="flex items-baseline space-x-3 mb-1">
                      <span className="text-xl font-black text-orange-500">{event.year}</span>
                      <span className="text-lg font-bold text-gray-900">{event.title}</span>
                    </div>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Responsibility */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                Giving Back to <span className="text-orange-500">Tema</span>
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Fitness isn&apos;t just about personal gain — it&apos;s about lifting your community.
                We&apos;re committed to making health and wellness accessible to everyone in Tema.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Youth Fitness Programs</h4>
                    <p className="text-gray-600 text-sm">Free Saturday classes for underprivileged youth in the Tema community.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Health Awareness</h4>
                    <p className="text-gray-600 text-sm">Quarterly free health screenings and wellness workshops open to the public.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Community Events</h4>
                    <p className="text-gray-600 text-sm">Monthly charity fitness challenges and fundraisers for local causes.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Senior Wellness</h4>
                    <p className="text-gray-600 text-sm">Specialized classes and discounted memberships for seniors (60+).</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white border-gray-200 p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl md:text-6xl font-black text-orange-500 mb-2">&quot;We&apos;re What We Eat!&quot;</div>
                  <p className="text-gray-500 text-sm uppercase tracking-wider">Our Motto Since 2015</p>
                </div>
                <div className="w-16 h-1 bg-orange-500 mx-auto mb-6" />
                <p className="text-gray-700 text-center leading-relaxed mb-8">
                  Every membership helps fund our community programs. When you train at GemFitness,
                  you&apos;re not just investing in yourself — you&apos;re investing in Tema.
                </p>
                <Link href="/membership">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
                    Become a Member
                  </Button>
                </Link>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Come See for Yourself
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Book a free tour and experience why 2,500+ members call GemFitness home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  Schedule a Tour
                </Button>
              </Link>
              <Link href="/membership">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-6">
                  View Membership Plans
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
