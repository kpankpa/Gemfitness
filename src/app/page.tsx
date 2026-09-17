'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Users,
  Trophy,
  Target,
  CheckCircle,
  Clock,
  MessageCircle,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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

const faqs = [
  { q: 'How does the free first month work?', a: 'Simply pay the one-time GH₵250 registration fee to join. Your first 30 days are completely free, with no plan charge and full gym access. After 30 days, your chosen plan (Monthly, Quarterly, or Annual) begins automatically.' },
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
  const [_successStories, setSuccessStories] = useState<Record<string, unknown>[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  
  const memberCount = 100;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    vid.defaultMuted = true;
    vid.muted = true;
    vid.playsInline = true;

    const tryPlay = () => {
      if (cancelled) return;
      const playAttempt = vid.play();
      if (playAttempt !== undefined) {
        playAttempt.catch(() => {
          // Autoplay can still be blocked by the browser; ignore.
        });
      }
    };

    tryPlay();

    const onCanPlay = () => tryPlay();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && vid.paused) {
        tryPlay();
      }
    };

    vid.addEventListener('canplay', onCanPlay);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      vid.removeEventListener('canplay', onCanPlay);
      document.removeEventListener('visibilitychange', onVisibility);
      vid.pause();
    };
  }, []);

  useEffect(() => {
    const fetchPlansData = async () => {
      try {
        const response = await fetch('/api/public/plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
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
      {/* Hero */}
      <section className="relative isolate flex min-h-[64vh] items-center overflow-hidden sm:min-h-[70vh]">
        <div className="absolute inset-0 bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
            onLoadedData={() => {
              videoRef.current?.play().catch(() => {});
            }}
            onTimeUpdate={() => {
              if (videoRef.current && videoRef.current.currentTime >= 17) {
                videoRef.current.currentTime = 0;
              }
            }}
          >
            <source src="/videos/Hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex max-w-md flex-col items-start text-left"
          >
            <span className="mb-4 inline-block border-l-2 border-orange-400 pl-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400 sm:mb-5 sm:text-xs">
              GemFitness
            </span>

            <h1 className="mb-3 !text-[2.1rem] !font-black !leading-[0.9] !tracking-[-0.045em] !text-white uppercase sm:!text-[2.65rem] md:!text-[3rem]">
              <span className="block">We Are</span>
              <span className="mt-1 block">What We Eat</span>
            </h1>

            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/80 sm:mb-7 sm:max-w-sm sm:text-[15px]">
              Coaching, group classes, and gym access in Gbestile, Tema.
            </p>

            <Link href="/signup?plan=quarterly" className="group">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#FF5500] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e64d00] active:bg-[#cc4400]"
              >
                <Play className="h-4 w-4 fill-current" />
                Join Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Key figures */}
      <section aria-label="GemFitness at a glance" className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-3 px-3 sm:px-6 lg:px-8">
          {[
            { value: `${memberCount}+`, label: 'Active members' },
            { value: '16', label: 'Hours daily' },
            { value: '5★', label: 'Member rating' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-0 flex-col items-center justify-center px-2 py-7 text-center sm:py-9"
            >
              <strong className="text-2xl font-black tracking-tight text-orange-600 sm:text-4xl">
                {stat.value}
              </strong>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 sm:text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Class categories */}
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
            <p className="text-gray-600 text-sm mt-2">See class times, formats, and availability.</p>
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
                description: 'Choose an affordable plan without a long-term commitment.',
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

              {/* Full-bleed image */}
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

          {/* Meet Our Team CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-4"
          >
            <Link
              href="/trainers"
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-bold text-lg group"
            >
              Meet Our Team
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
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

          {/* Most popular plan only */}
          <div className="max-w-md mx-auto mb-8">
            {plansLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p className="mt-2 text-gray-700">Loading plans...</p>
              </div>
            ) : (() => {
              const popular = plans.find((p) => p.isPopular) ?? plans[0];
              if (!popular) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="relative pt-6"
                >
                  <motion.div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 z-20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white text-sm font-bold px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </motion.div>

                  <Card className="relative overflow-hidden group transition-all duration-500 border-2 border-orange-500 shadow-2xl shadow-orange-500/20">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-orange-50 via-white to-orange-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full z-0" />

                    <CardHeader className="relative z-10">
                      <CardTitle className="text-2xl text-gray-900">{popular.name}</CardTitle>
                      <CardDescription>
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                          GH₵{popular.price}
                          <span className="text-lg text-gray-700">/{popular.duration} {popular.durationUnit}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <ul className="space-y-3">
                        {popular.features.slice(0, 5).map((feature: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {popular.features.length > 5 && (
                          <li className="text-sm text-gray-500">+{popular.features.length - 5} more features</li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter className="relative z-10">
                      <Link href={`/signup?plan=${popular.slug.toLowerCase()}`} className="w-full">
                        <Button className="w-full text-lg font-semibold py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white uppercase tracking-wide transition-all duration-300">
                          Get Started
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })()}
          </div>

          <div className="text-center">
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-bold text-lg group"
            >
              View all membership plans
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
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
              Ready to Train<br />With Us?
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
              <Link href="/signup">Join GemFitness</Link>
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
