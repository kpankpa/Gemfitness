'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Dumbbell,
  Users,
  Trophy,
  Target,
  CheckCircle,
  Clock,
  ChevronDown,
  MessageCircle,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { staggerContainer, fadeUp, ctaMicro } from '@/lib/animations';
import { formatCurrency } from '@/lib/utils';

// Type definitions
interface GymPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  durationUnit: string;
  slug: string;
  isPopular?: boolean;
  savings?: number;
  comparisonText?: string;
  features: string[];
  memberCount?: number;
}

interface GymStats {
  totalActiveMembers?: number;
  [key: string]: unknown;
}

// Sample data
const trainers = [
  { name: 'Instructor Fireman', specialty: 'Strength & Conditioning', image: '/trainers/instructor_Fireman.jpeg' },
  { name: 'instructor Alby', specialty: 'HIIT & Cardio', image: '/trainers/instructor_Alby.jpeg' },
  { name: 'Instructor Fred', specialty: 'Boxing & Combat', image: '/trainers/instructor_Fred.jpeg' },
  { name: 'Official Energy', specialty: 'Dancing ', image: '/trainers/official_energy.jpeg' },
];


const faqs = [
  { q: 'What are your operating hours?', a: 'Monday-Friday: 5:00 AM - 10:00 PM, Saturday-Sunday: 7:00 AM - 8:00 PM' },
  { q: 'Do I need to book classes in advance?', a: 'Group classes require booking through your member dashboard. Open gym sessions are walk-in anytime.' },
  { q: 'What is included in membership?', a: 'All memberships include full gym access, group classes, locker facility, showers, and basic fitness assessment.' },
  { q: 'Can I freeze my membership?', a: 'Yes! Quarterly and Annual members can freeze membership for up to 2 weeks per year with 48 hours notice.' },
  { q: 'Do you offer personal training?', a: 'Yes! One-on-one personal training sessions are available. Contact us for rates and trainer availability.' },
  { q: 'Is there parking available?', a: 'Yes, we have free parking for all members right at our Tema Gbestile location.' },
];

export default function HomePage() {

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Dynamic plans data
  const [plans, setPlans] = useState<GymPlan[]>([]);
  const [gymStats, setGymStats] = useState<GymStats | null>(null);
  const [_successStories, setSuccessStories] = useState<Record<string, unknown>[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  
  const memberCount = gymStats?.totalActiveMembers || 500; // Dynamic member count

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchPlansData = async () => {
      try {
        const response = await fetch('/api/public/plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
          setGymStats(data.gymStats || null);
          setSuccessStories(data.successStories || []);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlansData();
  }, []);



  return (
    <div className="min-h-screen bg-white">
      {/* Floating top-right CTA removed to avoid nav overlap on smaller screens */}
      {/* Hero Section with Modern Light Design */}
      <section className="relative min-h-[calc(100vh-5rem)] sm:min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/strength.png"
            alt="Training at GemFitness"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Content Overlay */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full">
          <div className="max-w-3xl">
            <motion.div
              {...(!shouldReduceMotion ? { variants: staggerContainer, initial: 'hidden', animate: 'show' } : {})}
            >
              <motion.div
                {...(!shouldReduceMotion ? { variants: fadeUp } : {})}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6 font-semibold border border-white/30"
              >
                <Trophy className="h-5 w-5" />
                <span>We&apos;re What We Eat!</span>
              </motion.div>

              <motion.h1 {...(!shouldReduceMotion ? { variants: fadeUp } : {})} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-white">
                Transform Your <span className="text-orange-400">Body & Mind</span> in Tema
              </motion.h1>

              <motion.p {...(!shouldReduceMotion ? { variants: fadeUp } : {})} className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed max-w-2xl">
                Join <strong className="text-orange-300 font-bold">{memberCount}+ members</strong> for expert coaching, modern equipment, and a supportive community built for real results.
              </motion.p>

              <motion.div {...(!shouldReduceMotion ? { variants: fadeUp } : {})} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
                <motion.div {...(!shouldReduceMotion ? { whileHover: ctaMicro.hover, whileTap: ctaMicro.tap } : {})} className="w-full sm:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="text-base sm:text-lg group bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto touch-manipulation shadow-2xl focus:outline-none focus:ring-4 focus:ring-orange-300"
                  >
                    <Link href="/signup?plan=quarterly">
                      Join Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div {...(!shouldReduceMotion ? { whileHover: { scale: 1.02 } } : {})} className="w-full sm:w-auto">
                  <Button asChild size="lg" variant="outline" className="text-base sm:text-lg border-2 border-white text-white hover:bg-white/20 font-semibold h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto touch-manipulation">
                    <Link href="#pricing">
                      View Memberships
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              <p className="text-sm sm:text-base text-white/80 mb-6">
                Memberships from <span className="text-orange-300 font-bold ">GH₵200/month</span> • One-time registration fee {formatCurrency(250)}
              </p>

              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, repeat: Infinity, repeatDelay: 3.5 }}
                  whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
                  className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:border-white/40 hover:bg-white/20 transition-all cursor-pointer"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6, repeat: Infinity, repeatDelay: 3.5 }}
                    className="text-2xl sm:text-3xl font-bold text-orange-300 mb-1"
                  >
                    {memberCount}+
                  </motion.div>
                  <div className="text-xs sm:text-sm text-white/90 font-medium">Active Members</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, repeat: Infinity, repeatDelay: 3.5 }}
                  whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
                  className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:border-white/40 hover:bg-white/20 transition-all cursor-pointer"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6, repeat: Infinity, repeatDelay: 3.5 }}
                    className="text-2xl sm:text-3xl font-bold text-orange-300 mb-1"
                  >
                    16
                  </motion.div>
                  <div className="text-xs sm:text-sm text-white/90 font-medium">Hours Daily</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, repeat: Infinity, repeatDelay: 3.5 }}
                  whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
                  className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:border-white/40 hover:bg-white/20 transition-all cursor-pointer"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6, repeat: Infinity, repeatDelay: 3.5 }}
                    className="text-2xl sm:text-3xl font-bold text-orange-300 mb-1"
                  >
                    5★
                  </motion.div>
                  <div className="text-xs sm:text-sm text-white/90 font-medium">Rated</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          {...(!shouldReduceMotion ? { animate: { y: [0, 10, 0] }, transition: { duration: 1.5, repeat: Infinity } } : {})}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="h-8 w-8 text-white/70" />
        </motion.div>

        {/* Curved Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[120px] block" preserveAspectRatio="none">
            <path d="M0,80 C320,120 640,60 960,80 C1120,90 1280,100 1440,80 L1440,120 L0,120 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Class Category Cards Section - GoodLife Inspired */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              With <span className="text-orange-500">120+</span> classes to choose from,<br />
              there&apos;s a class for everyone at <span className="text-orange-500">GemFitness</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                title: 'CARDIO',
                description: 'Get your heart pumping.',
                image: '/images/cardio.png',
                color: 'orange',
              },
              {
                title: 'STRENGTH',
                description: 'Build muscle. Build confidence.',
                image: '/images/strength.jpg',
                color: 'orange',
              },
              {
                title: 'Dance Classes',
                description: 'Move to the rhythm. Feel alive.',
                image: '/images/dance_class.png',
                color: 'orange',
              },
            ].map((category, i) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                className="group relative h-[400px] sm:h-[450px] overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className={`group-hover:scale-110 transition-transform duration-700 ${
                      category.title === 'CARDIO' 
                        ? 'object-cover object-[center_20%]' 
                        : 'object-cover'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                
                <div className="relative h-full flex flex-col justify-end p-8">
                  <motion.h3
                    className="text-4xl sm:text-5xl font-black text-white mb-3"
                    initial={{ x: -20 }}
                    whileInView={{ x: 0 }}
                    viewport={{ once: true }}
                  >
                    {category.title}
                  </motion.h3>
                  <p className="text-white/90 text-lg mb-6">{category.description}</p>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold w-fit group-hover:scale-105 transition-transform"
                    asChild
                  >
                    <Link href="/classes">CLASS SCHEDULE</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Learn More CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-12"
          >
            <Link 
              href="/classes"
              className="inline-flex items-center gap-3 text-orange-600 hover:text-orange-700 font-semibold text-lg group"
            >
              <span>Explore All Classes & Schedules</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </motion.div>
            </Link>
            <p className="text-gray-600 text-sm mt-2">Find the perfect class for your fitness journey</p>
          </motion.div>
        </div>
      </section>

      {/* Value Props Section - Planet Fitness Inspired */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Skewed background accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-900/5 to-transparent transform skew-x-12 origin-top-right backdrop-blur-sm" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              A PLACE WHERE <span className="text-orange-500">EVERYONE</span> FEELS<br />WELCOME
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in providing a high-quality fitness experience at an affordable cost.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Trophy,
                title: 'Premium Equipment',
                description: 'State-of-the-art cardio and strength equipment, all in a clean and modern environment.',
              },
              {
                icon: Users,
                title: 'Expert Coaching',
                description: 'Certified trainers dedicated to helping you achieve your fitness goals with personalized guidance.',
              },
              {
                icon: Sparkles,
                title: 'Flexible Memberships',
                description: 'Affordable plans with no long-term commitments. Start your fitness journey on your terms.',
              },
            ].map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500 mb-6 group-hover:scale-105 transition-all duration-200">
                  <prop.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{prop.title}</h3>
                <p className="text-gray-600 leading-relaxed">{prop.description}</p>
                <Button
                  variant="link"
                  className="mt-4 text-orange-500 group-hover:translate-x-2 transition-transform"
                  asChild
                >
                  <Link href="/membership">
                    Learn More <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/233249003832"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-[#25D366] text-white p-3 sm:p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform touch-manipulation"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>

      {/* Consolidated Training & Trainers Section */}
      <section id="trainers" className="py-20 lg:py-28 relative overflow-hidden bg-white">
        {/* Background Image Header */}
        <div className="absolute inset-0 h-[600px]">
          <Image
            src="/images/training_at_gem.png"
            alt="Training at GemFitness"
            fill
            sizes="100vw"
            quality={95}
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-white" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-16 pt-12"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
              TRAINING AT GEMFITNESS
            </h2>
            <p className="text-xl sm:text-2xl text-white/95 max-w-3xl mx-auto">
              From beginners to pros, we have the tools and expertise to help you reach your fitness goals.
            </p>
          </motion.div>

          {/* Service Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
            {[
              {
                title: 'Personal Training',
                description: 'One-on-one coaching with customized workout plans designed to help you reach peak performance.',
                icon: Target,
              },
              {
                title: 'Group Classes',
                description: 'Energetic group classes like HIIT and BodyPump that cater to all fitness levels and keep you motivated.',
                icon: Users,
              },
              {
                title: 'Performance Training',
                description: 'Advanced training programs using modern equipment and free weights to build strength and precision.',
                icon: Trophy,
              },
            ].map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                className="relative bg-white p-8 border border-gray-200 hover:border-orange-400 group cursor-pointer overflow-hidden"
              >
                {/* Skewed background accent */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/5 transform rotate-12 group-hover:bg-orange-500/10 transition-colors duration-300" />
                
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Training Benefits */}
          <div className="relative bg-white mb-20 overflow-hidden">
            <div className="grid lg:grid-cols-2 items-stretch">
              {/* Left: Text content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 lg:py-24"
              >
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-gray-900 tracking-tight leading-tight">
                  TRAINING<br />PROGRAMS
                </h3>
                <div className="w-24 h-1 bg-orange-500 mb-8" />
                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-10 max-w-lg">
                  Got goals? We&apos;ll help you reach them. Whether it&apos;s Personal, Team or Performance Training, our certified instructors are here to help you succeed.
                </p>
                <div>
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-3 transition-all duration-200"
                  >
                    <Link href="/trainers">Learn more about Training</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Right: Image — bleeds to the edge */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative min-h-[400px] lg:min-h-[550px]"
              >
                <Image
                  src="/images/why_choose_us.png"
                  alt="Personal Training at GemFitness"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
          </div>

          {/* Meet Our Trainers */}
          <div className="text-center mb-12">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900"
            >
              Meet Your <span className="text-orange-500">Expert Trainers</span>
            </motion.h3>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Certified professionals dedicated to your success.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {trainers.map((trainer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                className="group relative h-[400px] sm:h-[450px] overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0">
                  <Image
                    src={trainer.image}
                    alt={trainer.name}
                    fill
                    className="object-cover object-[center_20%] group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.classList.add('bg-gradient-to-br', 'from-orange-50', 'to-orange-100');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="relative h-full flex flex-col justify-end p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
                    {trainer.name}
                  </h3>
                  <p className="text-orange-400 font-semibold text-sm mb-1">{trainer.specialty}</p>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold w-fit group-hover:scale-105 transition-transform"
                    asChild
                  >
                    <Link href="/signup">Book a Session</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-neutral-50 overflow-hidden">
        {/* Skewed background accent */}
        <div className="absolute bottom-0 right-0 w-2/5 h-3/4 bg-gradient-to-l from-gray-900/5 to-transparent transform skew-x-6 backdrop-blur-sm" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-heading font-bold mb-4">
              Why Choose <span className="text-gradient">GemFitness</span>?
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Everything you need to succeed in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Dumbbell,
                title: "Modern Equipment",
                description: "State-of-the-art machines and free weights for all fitness levels",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: Users,
                title: "Expert Trainers",
                description: "Certified professionals to guide and motivate you every step",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Clock,
                title: "Convenient Hours",
                description: "Open early morning to late evening, 7 days a week",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Target,
                title: "Goal Tracking",
                description: "Monitor your progress with our digital check-in system",
                gradient: "from-yellow-500 to-orange-500"
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="h-full border border-gray-200 hover:border-orange-400 transition-all duration-200 overflow-hidden">
                  <CardHeader className="space-y-4">
                    <div className={`h-16 w-16 bg-orange-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-200`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-lg text-neutral-600">
              Everything you need to know about GemFitness
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{faq.q}</CardTitle>
                      {openFaq === i ? <Minus className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                    </div>
                  </CardHeader>
                  {openFaq === i && (
                    <CardContent>
                      <p className="text-neutral-600">{faq.a}</p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-14 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-3 sm:mb-4">
              Simple, <span className="text-gradient">Transparent</span> Pricing
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto px-4">
              Choose the plan that fits your lifestyle. All plans include full gym access and amenities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {plansLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p className="mt-2 text-gray-700">Loading plans...</p>
              </div>
            ) : (
              plans.slice(0, 3).map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: i * 0.15,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -12,
                    transition: { duration: 0.3 }
                  }}
                  className="relative"
                >
                  {plan.isPopular && (
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
                  )}

                  <Card className={`h-full relative overflow-hidden group transition-all duration-500 ${
                    plan.isPopular
                      ? 'border-2 border-orange-500 shadow-2xl shadow-orange-500/30 scale-105' 
                      : 'border-2 border-gray-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/20'
                  }`}>
                    {/* Gradient Background Effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      plan.isPopular
                        ? 'bg-gradient-to-br from-orange-50 via-white to-orange-50' 
                        : 'bg-gradient-to-br from-orange-50/50 via-white to-white'
                    }`} />

                    {plan.isPopular && (
                      <>
                        {/* Corner Accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full z-0" />
                      </>
                    )}

                    <CardHeader className="relative z-10">
                      <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                      <CardDescription>
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                          GH₵{plan.price}
                          <span className="text-lg text-gray-700">/{plan.duration} {plan.durationUnit}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 flex-1">
                      <ul className="space-y-3">
                        {plan.features.slice(0, 5).map((feature: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 5 && (
                          <li className="text-sm text-gray-500">+{plan.features.length - 5} more features</li>
                        )}
                      </ul>
                      {plan.memberCount !== undefined && plan.memberCount > 0 && (
                        <div className="mt-4 text-sm text-gray-700 flex items-center">
                          <Users className="w-4 h-4 mr-1 text-orange-500" />
                          {plan.memberCount} active members
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="relative z-10">
                      <Link href={`/signup?plan=${plan.slug.toLowerCase()}`} className="w-full">
                        <Button className={`w-full text-lg font-semibold py-3 transition-all duration-300 uppercase tracking-wide ${
                          plan.isPopular
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}>
                          {plan.isPopular ? 'Get Started' : 'Choose Plan'}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <div className="text-center bg-primary/10 border border-primary/20 rounded-lg p-6">
            <p className="text-neutral-700">
              <strong>One-time registration fee:</strong> {formatCurrency(250)} (includes welcome kit & fitness assessment)
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-white overflow-hidden">
        {/* Skewed Background Accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-500">
          <div className="absolute -right-1/4 top-0 w-2/3 h-full bg-orange-400/30 transform skew-x-12" />
          <div className="absolute -left-1/4 bottom-0 w-2/3 h-full bg-orange-700/20 transform -skew-x-12" />
        </div>

        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rotate-45" />
          <div className="absolute bottom-20 right-20 w-40 h-40 border-4 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border-4 border-white" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white uppercase tracking-tight">
              Ready to Transform<br />Your Life?
            </h2>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-2xl mb-10 text-white/95 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Join GemFitness today and become part of Ghana&apos;s most supportive fitness community.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="text-lg bg-white text-orange-600 hover:bg-gray-50 font-bold border-2 border-white transition-all duration-300 hover:scale-105">
              <Link href="/signup">Start Your Journey</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg border-2 border-white bg-transparent text-white hover:bg-white hover:text-orange-600 font-bold transition-all duration-300">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="h-96 bg-neutral-200">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127121.7470828629!2d0.005!3d5.6698!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2b7a773%3A0xbed14ed8650e2dd3!2sTema%2C%20Ghana!5e0!3m2!1sen!2s!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="GemFitness Location"
        />
      </section>
    </div>
  );
}
