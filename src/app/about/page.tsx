'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  Target,
  Users,
  TrendingUp,
  Flame,
  ShieldCheck,
  Handshake,
  Smile,
  Dumbbell,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';

/* DATA */

const stats = [
  { number: '2,500+', label: 'Active Members' },
  { number: '50+', label: 'Weekly Classes' },
  { number: '15+', label: 'Expert Trainers' },
  { number: '9', label: 'Years Strong' },
];

const values = [
  { icon: Heart, label: 'Community', color: 'text-rose-500', bg: 'bg-rose-50' },
  { icon: ShieldCheck, label: 'Trust', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Handshake, label: 'Integrity', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: Smile, label: 'Energy', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { icon: Target, label: 'Peak Attitude', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Flame, label: 'Passion', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: TrendingUp, label: 'Results', color: 'text-teal-500', bg: 'bg-teal-50' },
  { icon: Dumbbell, label: 'Personal Fitness', color: 'text-gray-700', bg: 'bg-gray-100' },
];

const timeline = [
  { year: '2015', title: 'The Beginning', description: 'GemFitness opened its doors in Tema Gbestile with a simple mission: make fitness accessible to everyone.' },
  { year: '2017', title: 'Expanding the Vision', description: 'Doubled our space and launched group fitness studios to meet the growing demand of our community.' },
  { year: '2019', title: '1,000 Members Strong', description: "Reached our first major membership milestone as Tema's fastest-growing and most-loved gym." },
  { year: '2021', title: 'Next-Level Equipment', description: 'Major investment in premium equipment, full facility renovation, and expanded coaching programs.' },
  { year: '2023', title: 'Award-Winning', description: 'Named "Best Gym in Greater Accra Region" by Ghana Fitness Awards. The community voted.' },
  { year: '2024', title: 'Stronger Than Ever', description: '2,500+ active members, 50+ weekly classes, and a team of 15+ elite coaches still pushing the standard higher.' },
];

const commitments = [
  { icon: Users, title: 'Youth Fitness Programs', description: 'Free Saturday classes for underprivileged youth in the Tema community.' },
  { icon: Heart, title: 'Health Awareness', description: 'Quarterly free health screenings and wellness workshops open to the public.' },
  { icon: Calendar, title: 'Community Events', description: 'Monthly charity fitness challenges and fundraisers for local causes.' },
  { icon: MapPin, title: 'Senior Wellness', description: 'Specialized classes and discounted memberships for seniors aged 60 and above.' },
];

/* PAGE */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">

      {/* HERO */}
      <PageHero
        subtitle="About Us"
        title="Built in Tema. Built for You."
        description="From a single room in 2015 to Ghana's most-trusted fitness destination - this is our story."
        backgroundImage="/images/why_choose_us.png"
      />

      {/* MANIFESTO */}
      <section className="relative py-28 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block border-l-4 border-orange-500 pl-4 text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-6">
              Our Belief
            </span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1] tracking-tight mb-10">
              We believe fitness<br />
              changes{' '}
              <span className="text-orange-500">everything.</span>
            </h2>
            <div className="grid lg:grid-cols-2 gap-8 text-lg text-gray-600 leading-relaxed">
              <p>
                At GemFitness, we&apos;re more than a gym. We&apos;re a community built on the belief
                that when you invest in your health, every part of your life gets better - your
                confidence, your energy, your relationships, and your future.
              </p>
              <p>
                Whether you&apos;re stepping into a gym for the first time or training for your next
                competition, GemFitness is where you belong. Our elite coaches, world-class
                equipment, and real community make sure you never train alone.
              </p>
            </div>
          </motion.div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-3 bg-orange-500"
          style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}
        />
      </section>

      {/* STATS */}
      <section className="relative bg-gray-900 py-20 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <div className="text-5xl sm:text-6xl font-black text-orange-500 mb-2 leading-none">
                  {stat.number}
                </div>
                <div className="text-gray-400 uppercase tracking-[0.15em] text-xs font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-12 bg-white"
          style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%, 0 100%)' }}
        />
      </section>

      {/* OUR STORY */}
      <section className="pt-20 pb-0 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative h-[480px] sm:h-[580px] overflow-hidden">
              <Image
                src="/images/Gym_room.png"
                alt="Training at GemFitness"
                fill
                className="object-cover"
              />
              <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-orange-500 -z-10" />
            </div>
            <div className="absolute bottom-8 left-0 bg-gray-900 text-white px-6 py-4">
              <div className="text-2xl font-black text-orange-500">Est. 2015</div>
              <div className="text-xs uppercase tracking-widest text-gray-400">Tema, Ghana</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block border-l-4 border-orange-500 pl-4 text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-6">
              Our Story
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
              Born from a passion.<br />
              Proven by results.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              GemFitness was founded with one obsession - give the people of Tema access to world-class
              fitness without excuses. We started small, but from day one the standard was set: no compromise
              on coaching, no compromise on community, no compromise on results.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Nine years later, we&apos;re still the same gym at heart - just bigger, stronger, and more
              determined than ever. Every coach, every class, and every square metre of this facility exists
              for one reason: your transformation.
            </p>
            <div className="space-y-3">
              {['Elite certified coaching staff', 'State-of-the-art equipment', 'Community that holds you accountable', '50+ classes every single week'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="relative mt-24 py-28 px-6 sm:px-12 lg:px-16 bg-gray-50">
        <div
          className="absolute top-0 left-0 right-0 h-14 bg-white"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">
              Our Core Values
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4">
              What we stand for
            </h2>
            <div className="w-20 h-1 bg-orange-500 mx-auto mb-6" />
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              These values guide every decision we make - from how we train to how we treat every single person who walks through our doors.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.label}
                custom={i}
                variants={{
                  hidden: { opacity: 0, y: 30, rotate: 0 },
                  visible: (i: number) => ({
                    opacity: 1,
                    y: 0,
                    rotate: [0, -2.5, 2.5, -1.5, 1.5, -0.5, 0.5, 0],
                    transition: {
                      opacity: { duration: 0.4, delay: i * 0.07 },
                      y: { duration: 0.5, delay: i * 0.07 },
                      rotate: { duration: 0.6, delay: i * 0.07 + 0.4, ease: 'easeInOut' },
                    },
                  }),
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: '-60px' }}
                className="group flex flex-col items-center text-center py-8 px-4 bg-white border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-16 h-16 ${v.bg} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <v.icon className={`w-8 h-8 ${v.color}`} strokeWidth={1.8} />
                </div>
                <span className="text-gray-900 font-black text-sm uppercase tracking-wider">
                  {v.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-14 bg-gray-900"
          style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}
        />
      </section>

      {/* TIMELINE */}
      <section className="bg-gray-900 pt-28 pb-24 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="inline-block border-l-4 border-orange-500 pl-4 text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">
              The Journey
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              From zero to<br />
              <span className="text-orange-500">unstoppable.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-700">
            {timeline.map((event, i) => (
              <motion.div
                key={event.year}
                custom={i}
                variants={{
                  hidden: { opacity: 0, y: 20, rotate: 0 },
                  visible: (i: number) => ({
                    opacity: 1,
                    y: 0,
                    rotate: [0, -2.5, 2.5, -1.5, 1.5, -0.5, 0.5, 0],
                    transition: {
                      opacity: { duration: 0.4, delay: i * 0.1 },
                      y: { duration: 0.5, delay: i * 0.1 },
                      rotate: { duration: 0.6, delay: i * 0.1 + 0.4, ease: 'easeInOut' },
                    },
                  }),
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: '-60px' }}
                className="bg-gray-900 p-8 hover:bg-gray-800 transition-colors group"
              >
                <div className="text-5xl font-black text-orange-500/20 group-hover:text-orange-500/40 transition-colors mb-3 leading-none">
                  {event.year}
                </div>
                <div className="w-8 h-0.5 bg-orange-500 mb-4" />
                <h3 className="text-white font-black text-lg mb-2">{event.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="relative bg-white pt-24 pb-28 px-6 sm:px-12 lg:px-16">
        <div
          className="absolute top-0 left-0 right-0 h-14 bg-gray-900"
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-2 lg:order-1"
            >
              <div className="relative h-[420px] sm:h-[520px] overflow-hidden">
                <Image
                  src="/images/dance_class.png"
                  alt="Community at GemFitness"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-white font-black text-2xl leading-tight">
                    &ldquo;Every membership helps build a healthier Tema.&rdquo;
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-1 lg:order-2"
            >
              <span className="inline-block border-l-4 border-orange-500 pl-4 text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-6">
                Giving Back
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
                Fitness isn&apos;t just<br />
                personal. It&apos;s{' '}
                <span className="text-orange-500">communal.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-10">
                When you train here, you&apos;re part of something bigger. We reinvest in Tema every day
                through programs that make health accessible to those who need it most.
              </p>
              <div className="space-y-6">
                {commitments.map((c, i) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-5"
                  >
                    <div className="w-12 h-12 bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <c.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 mb-1">{c.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{c.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MOTTO STRIP */}
      <section
        className="relative py-24 px-6 sm:px-12 lg:px-16 bg-orange-500 overflow-hidden"
        style={{ clipPath: 'polygon(0 6%, 100% 0, 100% 94%, 0 100%)' }}
      >
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-white/70 font-bold uppercase tracking-[0.3em] text-xs mb-4">
              Our Motto Since 2015
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              &ldquo;We&apos;re What We Eat!&rdquo;
            </h2>
          </motion.div>
        </div>
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-[280px] font-black text-white/5 leading-none select-none pointer-events-none">
          G
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 sm:px-12 lg:px-16 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-6">
              Ready?
            </span>
            <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
              Come see it<br />for yourself.
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto">
              Book a free tour and experience why 2,500+ members call GemFitness home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-7 rounded-none">
                  Schedule a Free Tour
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/membership">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold text-lg px-10 py-7 rounded-none">
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
