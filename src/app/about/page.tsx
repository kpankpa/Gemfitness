'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  Target,
  Users,
  Award,
  Building2,
  Dumbbell,
  Clock,
  Shield,
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const values = [
  {
    icon: Heart,
    title: 'Community First',
    description: 'We build a supportive environment where everyone feels welcome and motivated to reach their goals.',
  },
  {
    icon: Target,
    title: 'Excellence',
    description: 'From equipment to coaching, we maintain the highest standards in everything we do.',
  },
  {
    icon: Users,
    title: 'Inclusivity',
    description: 'Fitness is for everyone. All ages, levels, and backgrounds are celebrated here.',
  },
  {
    icon: TrendingUp,
    title: 'Results-Driven',
    description: 'We measure success by your progress and celebrate every milestone achieved.',
  },
];

const facilities = [
  {
    name: 'Cardio Zone',
    description: 'State-of-the-art treadmills, bikes, rowing machines, and more',
    features: ['20+ Cardio Machines', 'Individual TV Screens', 'Heart Rate Monitoring', 'Virtual Training'],
    icon: Heart,
  },
  {
    name: 'Strength Training Area',
    description: 'Comprehensive free weights and resistance equipment',
    features: ['Olympic Lifting Platform', 'Power Racks', 'Full Dumbbell Set (2-50kg)', 'Cable Machines'],
    icon: Dumbbell,
  },
  {
    name: 'Group Fitness Studios',
    description: 'Spacious studios for classes and group training',
    features: ['2 Climate-Controlled Studios', 'Premium Sound System', 'Spring-Loaded Floors', 'Mirror Walls'],
    icon: Users,
  },
  {
    name: 'Functional Training',
    description: 'Dedicated space for HIIT, bootcamp, and functional workouts',
    features: ['Turf Area', 'Battle Ropes', 'Kettlebells', 'Plyometric Boxes'],
    icon: Sparkles,
  },
  {
    name: 'Locker Rooms',
    description: 'Clean, spacious facilities with premium amenities',
    features: ['Private Showers', 'Sauna', 'Day Lockers', 'Grooming Stations'],
    icon: Building2,
  },
  {
    name: 'Recovery Zone',
    description: 'Dedicated area for stretching and recovery',
    features: ['Foam Rollers', 'Massage Guns', 'Stretching Mats', 'Recovery Tools'],
    icon: Shield,
  },
];

const timeline = [
  {
    year: '2015',
    title: 'The Beginning',
    description: 'GemFitness opened its doors in Tema Gbestile, Ghana with a vision to transform the local fitness culture. "We\'re What We Eat!" became our motto.',
  },
  {
    year: '2017',
    title: 'Expansion',
    description: 'Doubled our space to accommodate growing membership and added group fitness studios.',
  },
  {
    year: '2019',
    title: '1,000 Members',
    description: 'Reached milestone of 1,000 active members and became Tema\'s largest fitness community.',
  },
  {
    year: '2021',
    title: 'Equipment Upgrade',
    description: 'Invested ₵500,000 in premium equipment and facility renovations.',
  },
  {
    year: '2023',
    title: 'Award-Winning',
    description: 'Named "Best Gym in Greater Accra Region" by Ghana Fitness Awards.',
  },
  {
    year: '2024',
    title: 'Going Strong',
    description: '2,500+ members, 50+ weekly classes, and still growing!',
  },
];

const awards = [
  { title: 'Best Gym in Greater Accra', year: '2023', org: 'Ghana Fitness Awards' },
  { title: 'Community Impact Award', year: '2022', org: 'Tema Chamber of Commerce' },
  { title: 'Excellence in Customer Service', year: '2023', org: 'Business Excellence Ghana' },
  { title: 'Top Employer - Fitness Industry', year: '2024', org: 'HR Ghana' },
];

const stats = [
  { number: '2,500+', label: 'Active Members', icon: Users },
  { number: '50+', label: 'Weekly Classes', icon: Calendar },
  { number: '15+', label: 'Expert Trainers', icon: Award },
  { number: '9', label: 'Years of Excellence', icon: TrendingUp },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="About Us"
        title="Our Story"
        description="From a small gym in 2015 to Tema's premier fitness destination. Learn about our journey, values, and commitment to your success."
      />

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <Card className="bg-white border-gray-200 p-6">
                  <stat.icon className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our <span className="text-orange-500">Mission</span>
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                To empower every individual in our community to achieve their fitness goals through world-class facilities, 
                expert coaching, and an inclusive, supportive environment.
              </p>
              <p className="text-gray-600 mb-6">
                At GemFitness, we believe fitness is more than just physical transformation—it&apos;s about building confidence, 
                creating healthy habits, and being part of a community that lifts each other up.
              </p>
              <p className="text-gray-600">
                Whether you&apos;re a beginner taking your first steps or an athlete pushing your limits, we&apos;re here 
                to guide, motivate, and celebrate your journey every step of the way.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-orange-500/20 to-transparent border-orange-500/30 p-8">
                <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-transparent rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="w-24 h-24 text-orange-500/50" />
                </div>
                <p className="text-gray-700 text-center italic">
                  &quot;GemFitness isn&apos;t just a gym—it&apos;s a lifestyle, a community, and a commitment to being your best self.&quot;
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Core Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-orange-500">Core Values</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from how we train to how we treat our community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 p-6 hover:border-orange-500/30 transition-all h-full">
                  <value.icon className="w-12 h-12 text-orange-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Tour */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              World-Class <span className="text-orange-500">Facilities</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take a tour of our 15,000 sq ft facility equipped with everything you need to succeed.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility, index) => (
              <motion.div
                key={facility.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/50 transition-all h-full">
                  <div className="p-6">
                    <facility.icon className="w-12 h-12 text-orange-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{facility.name}</h3>
                    <p className="text-gray-600 mb-4">{facility.description}</p>
                    <ul className="space-y-2">
                      {facility.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
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
            <Link href="/contact">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                Schedule a Facility Tour
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
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
              From humble beginnings to becoming Tema&apos;s premier fitness destination.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-500/50 to-transparent" />

            <div className="space-y-8">
              {timeline.map((event, index) => (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-5 top-1 w-6 h-6 bg-orange-500 rounded-full border-4 border-black" />
                  
                  <Card className="bg-white border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl font-bold text-orange-500">{event.year}</span>
                      <span className="text-xl font-bold text-gray-900">{event.title}</span>
                    </div>
                    <p className="text-gray-600">{event.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Award className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Awards & <span className="text-orange-500">Recognition</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We&apos;re honored to be recognized for our commitment to excellence and community impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {awards.map((award, index) => (
              <motion.div
                key={award.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{award.title}</h3>
                      <p className="text-sm text-gray-600">{award.org}</p>
                      <p className="text-sm text-orange-500 font-semibold mt-1">{award.year}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Impact */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                Community <span className="text-orange-500">Impact</span>
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                We&apos;re more than a gym—we&apos;re a force for positive change in Tema.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Youth Fitness Programs</h4>
                    <p className="text-gray-600">Free fitness classes for underprivileged youth every Saturday</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Heart className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Health Awareness</h4>
                    <p className="text-gray-600">Quarterly free health screenings and wellness workshops</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Community Events</h4>
                    <p className="text-gray-600">Monthly charity fitness challenges and fundraisers</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Senior Programs</h4>
                    <p className="text-gray-600">Specialized classes and discounted memberships for seniors</p>
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
                <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-transparent rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-32 h-32 text-orange-500/30" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Join the Movement</h3>
                <p className="text-gray-700 text-center mb-6">
                  Be part of a gym that gives back. Every membership helps us support our community initiatives.
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Building2 className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Experience GemFitness Yourself
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Book a free tour and see why we&apos;re Tema&apos;s #1 fitness destination.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  Schedule a Tour
                </Button>
              </Link>
              <Link href="/membership">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-6">
                  View Membership Options
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

