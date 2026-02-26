'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, CalendarDays, Sparkles, Users, ArrowRight, Trophy, Flame, Music, ChevronRight, Clock, Star } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string | null;
  category: string | null;
  image: string | null;
}

const signatureEvents = [
  {
    id: 'challenge',
    tag: 'Annual Competition',
    title: 'GemFitness Fitness Challenge',
    headline: 'The biggest fitness showdown in Accra.',
    description: 'Every year, GemFitness members go head-to-head in a series of fitness challenges that test strength, endurance, and mental toughness. It\'s not just a competition — it\'s a celebration of how far you\'ve come. Whether you\'re competing or cheering, this day hits different.',
    image: '/images/strength.png',
    icon: Trophy,
    stats: [{ label: 'Participants', value: '100+' }, { label: 'Prize Pool', value: 'GHS 2K' }, { label: 'Categories', value: '5' }],
    date: 'Coming March 2026',
    accent: 'from-orange-500 to-red-500',
  },
  {
    id: 'wellness',
    tag: 'Community Event',
    title: 'Community Wellness Day',
    headline: 'A full day of fitness, food, and good vibes.',
    description: 'Open to members and the public — Community Wellness Day is our way of giving back to Accra. Free classes, nutrition talks, trainer meet-and-greets, and a whole lot of energy. Bring your family. Bring your friends. Come and feel what GemFitness is all about.',
    image: '/images/training_at_gem.jpg',
    icon: Users,
    stats: [{ label: 'Free Entry', value: '100%' }, { label: 'Duration', value: 'All Day' }, { label: 'Activities', value: '10+' }],
    date: 'Coming April 2026',
    accent: 'from-orange-400 to-orange-600',
  },
  {
    id: 'nighthiit',
    tag: 'Special Session',
    title: 'Night HIIT Bootcamp',
    headline: 'Lights low. Energy high. Zero excuses.',
    description: 'When the sun goes down, the real work begins. Our Night HIIT Bootcamp flips the script on your usual gym session — high-intensity circuits, pulsing music, and a crowd of people all pushing past their limits together. It\'s part workout, part experience. All results.',
    image: '/images/cardio.png',
    icon: Flame,
    stats: [{ label: 'Start Time', value: '8:00 PM' }, { label: 'Duration', value: '90 min' }, { label: 'Spots', value: 'Limited' }],
    date: 'Every Last Friday',
    accent: 'from-red-500 to-orange-400',
  },
  {
    id: 'daydance',
    tag: 'Workshop',
    title: 'Dance & Movement Workshop',
    headline: 'Move your body. Free your mind.',
    description: 'Led by Official Energy herself, this workshop blends dance fundamentals, aerobics, and freestyle movement into one sweat-soaked, smile-filled session. No experience needed. No judgement. Just music, movement, and a room full of people choosing joy.',
    image: '/images/dance_class.png',
    icon: Music,
    stats: [{ label: 'All Levels', value: '✓' }, { label: 'Duration', value: '2 Hours' }, { label: 'Instructor', value: 'Energy' }],
    date: 'Monthly Workshop',
    accent: 'from-orange-500 to-yellow-400',
  },
];

const eventCategories = [
  { label: 'Competition', icon: Trophy, color: 'bg-red-50 text-red-600 border-red-100' },
  { label: 'Workshop', icon: Sparkles, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { label: 'Community', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { label: 'Special Session', icon: Flame, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { label: 'Dance & Music', icon: Music, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { label: 'All Events', icon: CalendarDays, color: 'bg-gray-50 text-gray-600 border-gray-200' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All Events');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/public/events?limit=12');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Failed to load events. Please try again later.');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'workshop': return Sparkles;
      case 'competition': return Trophy;
      case 'social': return CalendarDays;
      default: return Calendar;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PageHero
        subtitle="Events"
        title="Where The Community Comes Alive"
        description="Competitions. Workshops. Special sessions. Community days. At GemFitness, there's always something worth showing up for."
        backgroundImage="/images/training_at_gem.jpg"
      />

      {/* ── TICKER STRIP ─────────────────────────────────────────────── */}
      <div className="bg-orange-500 py-3 overflow-hidden">
        <motion.div
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
        >
          {[...Array(4)].flatMap(() => [
            '🏆 Annual Fitness Challenge — March 2026',
            '⚡ Night HIIT Bootcamp — Every Last Friday',
            '💃 Dance & Movement Workshop — Monthly',
            '🤝 Community Wellness Day — April 2026',
          ]).map((item, i) => (
            <span key={i} className="text-white font-bold text-sm tracking-wide px-4">
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── EVENT CATEGORIES ─────────────────────────────────────────── */}
      <section className="py-12 px-6 sm:px-12 lg:px-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3">
            {eventCategories.map((cat) => (
              <motion.button
                key={cat.label}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border font-semibold text-sm transition-all ${
                  activeCategory === cat.label
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200'
                    : cat.color
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIGNATURE EVENTS — alternating image/text ────────────────── */}
      <section className="py-24 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4 border-l-2 border-orange-500 pl-4">
              Signature Events
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Events that define the culture
            </h2>
          </motion.div>

          <div className="space-y-32">
            {signatureEvents.map((event, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={event.id}
                  custom={index}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: (i: number) => ({
                      opacity: 1,
                      y: 0,
                      rotate: [0, -2, 2, -1, 1, -0.4, 0.4, 0],
                      transition: {
                        opacity: { duration: 0.5, delay: i * 0.1 },
                        y: { duration: 0.55, delay: i * 0.1 },
                        rotate: { duration: 0.6, delay: i * 0.1 + 0.5, ease: 'easeInOut' },
                      },
                    }),
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, margin: '-80px' }}
                  className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center`}
                >
                  {/* Image side */}
                  <div className={`relative ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    {/* Decorative background blob */}
                    <div className={`absolute -inset-4 bg-gradient-to-br ${event.accent} opacity-10 rounded-3xl blur-2xl`} />
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                      {/* Tag overlay */}
                      <div className="absolute top-5 left-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-full`}>
                          <event.icon className="w-3.5 h-3.5" />
                          {event.tag}
                        </span>
                      </div>
                      {/* Date badge */}
                      <div className="absolute bottom-5 right-5 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-orange-400" />
                          {event.date}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text side */}
                  <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                    <p className="text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">
                      {event.tag}
                    </p>
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.05] tracking-tight mb-4">
                      {event.title}
                    </h3>
                    <p className="text-xl font-semibold text-gray-700 mb-5 leading-snug">
                      {event.headline}
                    </p>
                    <p className="text-gray-500 leading-relaxed mb-8 text-[15px]">
                      {event.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex gap-6 mb-8 p-5 bg-gray-50 rounded-xl">
                      {event.stats.map((stat) => (
                        <div key={stat.label}>
                          <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link href="/signup">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-6 rounded-none text-sm">
                          Register Interest
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Link href="/contact">
                        <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-500 font-bold px-7 py-6 rounded-none text-sm transition-colors">
                          Ask a Question
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE STRIP ─────────────────────────────────────────── */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image src="/images/why_choose_us.png" alt="" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900/70" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-orange-400 font-bold tracking-[0.2em] text-xs uppercase mb-4 border-l-2 border-orange-400 pl-4">
                The Experience
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.05] mb-6">
                Every event is an<br />
                <span className="text-orange-400">unforgettable memory.</span>
              </h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-8">
                We don&apos;t just run fitness events. We create moments. The electricity in the room,
                the crowd pushing each other, the post-workout highs — every GemFitness event hits the same way:
                hard and unforgettable.
              </p>
              <Link href="/membership">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 rounded-none text-sm">
                  Get Member Priority Access
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {[
                { icon: Star, title: 'Members Get First Pick', body: 'Priority registration opens for members 48 hours before the public. The best spots go fast.' },
                { icon: Clock, title: 'Packed Schedule Year-Round', body: 'Competitions, socials, workshops, bootcamps — we keep the calendar full so you\'re never bored.' },
                { icon: Flame, title: 'Built for All Levels', body: 'Whether it\'s your first challenge or your tenth, every event has an entry point that\'s right for you.' },
                { icon: Trophy, title: 'Real Prizes, Real Recognition', body: 'We celebrate results. Win gear, gym credit, and the kind of bragging rights that last a lifetime.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-orange-500/40 transition-all"
                >
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS (DB) ─────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4 border-l-2 border-orange-500 pl-4">
              On The Calendar
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              What&apos;s coming up next
            </h2>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
              <p className="mt-4 text-gray-400 text-sm">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden bg-gray-50 border border-gray-100 px-10 py-16 text-center"
            >
              {/* decorative corner accents */}
              <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-orange-300 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-orange-300 rounded-br-2xl" />
              <div className="relative">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Calendar className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Rolling something big</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                  No events scheduled just yet — but they drop fast. Follow us on social or become a member to get notified first.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/signup">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 rounded-none">
                      Join to Get Notified
                    </Button>
                  </Link>
                  <Link href="/classes">
                    <Button variant="outline" className="border-2 border-gray-300 hover:border-orange-500 hover:text-orange-500 font-bold px-8 py-6 rounded-none transition-colors">
                      Browse Classes
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => {
                const EventIcon = getEventTypeIcon(event.category);
                return (
                  <motion.div
                    key={event.id}
                    custom={index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: (i: number) => ({
                        opacity: 1,
                        y: 0,
                        rotate: [0, -2, 2, -1, 1, -0.4, 0.4, 0],
                        transition: {
                          opacity: { duration: 0.35, delay: i * 0.05 },
                          y: { duration: 0.4, delay: i * 0.05 },
                          rotate: { duration: 0.55, delay: i * 0.05 + 0.35, ease: 'easeInOut' },
                        },
                      }),
                    }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, margin: '-40px' }}
                    className="group border border-gray-100 hover:border-orange-300 overflow-hidden transition-all hover:shadow-lg hover:shadow-orange-50"
                  >
                    {event.image ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image src={event.image} alt={event.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {event.category && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-full">
                            {event.category.toLowerCase().replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                    )}
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 transition-colors">
                          <EventIcon className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-orange-500 transition-colors">
                          {event.title}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      <Link href="/signup">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-none py-5">
                          Register Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
              How to join an event
            </h2>
            <div className="w-16 h-1 bg-orange-500 mx-auto" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-orange-200 z-0" />
            {[
              { step: '01', title: 'Join as a Member', body: 'Members get 48-hour early access to every event. Sign up once and never miss the drop.' },
              { step: '02', title: 'Watch the Calendar', body: 'Browse upcoming events on this page. New events drop regularly — check back often.' },
              { step: '03', title: 'Register Your Spot', body: 'Click \'Register Now\' to lock in your place. Spots fill fast, especially for Night Bootcamps.' },
              { step: '04', title: 'Show Up & Go Hard', body: 'Arrive early. Come ready. Bring the energy. The rest takes care of itself.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: (idx: number) => ({
                    opacity: 1,
                    y: 0,
                    rotate: [0, -2, 2, -1, 1, -0.4, 0.4, 0],
                    transition: {
                      opacity: { duration: 0.35, delay: idx * 0.12 },
                      y: { duration: 0.4, delay: idx * 0.12 },
                      rotate: { duration: 0.55, delay: idx * 0.12 + 0.35, ease: 'easeInOut' },
                    },
                  }),
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: '-40px' }}
                className="relative z-10 text-center"
              >
                <div className="w-[72px] h-[72px] bg-orange-500 text-white font-black text-xl flex items-center justify-center mx-auto mb-5 rounded-2xl shadow-lg shadow-orange-200">
                  {item.step}
                </div>
                <h4 className="font-black text-gray-900 text-lg mb-2">{item.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-12 lg:px-16 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-5">
              Be first. Every time.
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Members get priority access, first dibs on limited spots, and exclusive invites to events that never go public. Don&apos;t miss out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/membership">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-7 rounded-none">
                  Become a Member
                </Button>
              </Link>
              <Link href="/classes">
                <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white font-bold text-lg px-10 py-7 rounded-none transition-colors">
                  View Classes
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
