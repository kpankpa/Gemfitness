'use client';

import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight, Play, Users, Flame, Dumbbell, Music, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

// Class categories with images
const classCategories = [
  {
    id: 'cardio',
    title: 'CARDIO',
    image: '/images/cardio.png',
    description: 'Sweat it out and feel alive. Our cardio sessions are designed to boost your stamina, fire up your metabolism, and leave you feeling unstoppable.',
  },
  {
    id: 'strength',
    title: 'STRENGTH',
    image: '/images/strength.png',
    description: 'Sculpt. Lift. Transform. Whether you\'re new to weights or chasing personal records, our strength training builds power from the inside out.',
  },
  {
    id: 'dance',
    title: 'DANCE & AEROBICS',
    image: '/images/dance_class.png',
    description: 'Move to the rhythm in an energetic class that improves fitness while keeping the session enjoyable.',
  },
  {
    id: 'hiit',
    title: 'HIIT & CIRCUIT',
    image: '/images/training_at_gem.jpg',
    description: 'Short on time, big on results. Our high-intensity circuits push your limits in quick bursts that deliver maximum impact.',
  },
];

const weeklySchedule = [
  { 
    day: 'Monday', 
    shortDay: 'MON',
    classes: [
      { time: '5:30 AM', name: 'Boot Camp', type: 'hiit', duration: '90 min' },
      { time: '6:30 AM', name: 'Early Birds Class', type: 'cardio', duration: '60 min' },
      { time: '7:00 PM', name: 'Weight Training', type: 'strength', duration: '90 min' },
    ]
  },
  { 
    day: 'Tuesday', 
    shortDay: 'TUE',
    classes: [
      { time: '5:30 AM', name: 'Boot Camp', type: 'hiit', duration: '90 min' },
      { time: '6:30 AM', name: 'Early Birds Class', type: 'cardio', duration: '60 min' },
      { time: '7:00 AM', name: 'DM Class (Stepboard)', type: 'dance', duration: '120 min' },
    ]
  },
  { 
    day: 'Wednesday', 
    shortDay: 'WED',
    classes: [
      { time: '5:30 AM', name: 'Boot Camp', type: 'hiit', duration: '90 min' },
      { time: '6:30 AM', name: 'Early Birds Class', type: 'cardio', duration: '60 min' },
      { time: '7:00 PM', name: 'Weight Training', type: 'strength', duration: '90 min' },
    ]
  },
  { 
    day: 'Thursday', 
    shortDay: 'THU',
    classes: [
      { time: '5:30 AM', name: 'Boot Camp', type: 'hiit', duration: '90 min' },
      { time: '6:30 AM', name: 'Early Birds Class', type: 'cardio', duration: '60 min' },
      { time: '7:00 AM', name: 'DM Class (Stepboard)', type: 'dance', duration: '120 min' },
    ]
  },
  { 
    day: 'Friday', 
    shortDay: 'FRI',
    classes: [
      { time: '5:30 AM', name: 'Boot Camp', type: 'hiit', duration: '90 min' },
      { time: '6:30 AM', name: 'Early Birds Class', type: 'cardio', duration: '60 min' },
      { time: '7:00 PM', name: 'Weight Training', type: 'strength', duration: '90 min' },
    ]
  },
  { 
    day: 'Saturday', 
    shortDay: 'SAT',
    classes: [
      { time: '8:00 AM', name: 'Weekend Boot Camp', type: 'hiit', duration: '90 min' },
    ]
  },
];

// Class type styling
const classTypeConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  cardio: { color: 'text-red-500', bgColor: 'bg-red-500/10', icon: Flame },
  strength: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Dumbbell },
  dance: { color: 'text-purple-500', bgColor: 'bg-purple-500/10', icon: Music },
  hiit: { color: 'text-orange-500', bgColor: 'bg-orange-500/10', icon: Zap },
};

export default function ClassesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Full-Width Video/GIF Hero Section */}
      <section className="relative h-[70vh] sm:h-[80vh] lg:h-[90vh] overflow-hidden">
        {/* Video/GIF Background - Replace src with your dancing video/gif */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/dance_class.png"
        >
          {/* Add your MP4 video here */}
          <source src="/videos/dance-class.mp4" type="video/mp4" />
          {/* Fallback to image if video doesn't load */}
        </video>
        
        {/* Fallback Image (shows while video loads or if video fails) */}
        <Image
          src="/images/dance_class.png"
          alt="Dance fitness class at GemFitness"
          fill
          className="object-cover -z-10"
          priority
        />

        {/* Subtle Gradient Overlay - keeps video visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="max-w-3xl"
            >
              {/* Eyebrow Label */}
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block text-orange-400 font-medium tracking-[0.25em] text-xs sm:text-sm uppercase mb-6 border-l-2 border-orange-400 pl-4"
              >
                Group Training
              </motion.span>

              {/* Main Headline - Editorial Style */}
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-8"
              >
                <span 
                  className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter"
                  style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}
                >
                  MOVE
                </span>
                <span 
                  className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tighter bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent"
                  style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
                >
                  TOGETHER
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-base sm:text-lg md:text-xl text-white/80 font-light leading-relaxed mb-10 max-w-xl backdrop-blur-[2px]"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
              >
                Energy is contagious here. Join group sessions that challenge your body, 
                lift your spirit, and connect you with a community that moves as one.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Link href="/membership" className="group inline-block">
                  <button className="relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-10 sm:px-12 py-5 sm:py-6 text-base sm:text-lg rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    {/* Animated Shine Effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    {/* Button Content */}
                    <span className="relative z-10 flex items-center gap-3">
                      <Play className="w-5 h-5 fill-current" />
                      Join a Class
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    
                    {/* Glow Effect */}
                    <span className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(249,115,22,0.5)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Motivational Section */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                COMMIT.<br />
                <span className="text-gray-900">SWEAT.</span><br />
                <span className="text-orange-500">TRANSFORM.</span>
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-lg text-gray-600 leading-relaxed">
                Every session is a step toward the best version of yourself. Our trainers 
                bring the energy, technique, and support you need. All you have to do is show up ready.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Class Categories */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Find Your Groove
            </h2>
            <div className="w-20 h-1 bg-orange-500 mx-auto" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {classCategories.map((category, index) => (
              <motion.div
                key={category.id}
                custom={index}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: (i: number) => ({
                    opacity: 1,
                    y: 0,
                    rotate: [0, -2, 2, -1, 1, -0.4, 0.4, 0],
                    transition: {
                      opacity: { duration: 0.4, delay: i * 0.1 },
                      y: { duration: 0.45, delay: i * 0.1 },
                      rotate: { duration: 0.55, delay: i * 0.1 + 0.4, ease: 'easeInOut' },
                    },
                  }),
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: '-60px' }}
                className="group"
              >
                {/* Image */}
                <div className="relative h-72 sm:h-80 lg:h-96 overflow-hidden mb-6">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
                  {category.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {category.description}
                </p>
                <Link
                  href="#schedule"
                  className="inline-flex items-center text-orange-500 font-bold hover:text-orange-600 transition-colors group/link"
                >
                  VIEW SESSIONS
                  <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Class Sessions */}
      <section className="py-24 px-6 sm:px-12 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 rounded-3xl blur-2xl" />
              <div className="relative overflow-hidden aspect-[4/3]">
                <Image
                  src="/images/training_at_gem.jpg"
                  alt="Personal training session at GemFitness"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-black text-sm">1-on-1 Session</p>
                      <p className="text-gray-300 text-xs mt-0.5">Tailored entirely to you</p>
                    </div>
                    <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4 border-l-2 border-orange-500 pl-4">
                Personal Class Sessions
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.05] tracking-tight mb-5">
                Your trainer.<br />
                Your pace.<br />
                <span className="text-orange-500">Your results.</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6 text-[15px]">
                Group classes build momentum. Personal sessions provide focused, individual coaching.
                Work 1-on-1 with one of our expert coaches and get a programme designed entirely
                around your body, your goals, and your timeline.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8 text-[15px]">
                No distractions. No generic routines. Just you and a coach who&apos;s 100% focused on making you better.
              </p>

              {/* Feature list */}
              <div className="space-y-3 mb-10">
                {[
                  'Customised workout programme built for your goals',
                  'Flexible scheduling. Book when it works for you.',
                  'Continuous form correction and technique coaching',
                  'Nutrition guidance alongside your training',
                  'Regular progress check-ins and plan adjustments',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA link */}
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-8 py-4 transition-colors group"
              >
                SIGN UP TO JOIN A CLASS
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Weekly Schedule */}
      <section id="schedule" className="py-20 px-6 sm:px-12 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4 border-l-2 border-orange-500 pl-4">
              Weekly Schedule
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
              When We Train
            </h2>
            <p className="text-gray-500 max-w-xl text-[15px]">
              Choose a time that works for you. Sessions run daily for early risers and evening trainers.
            </p>
          </motion.div>

          {/* Class Type Legend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-3 mb-10"
          >
            {Object.entries(classTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${config.bgColor} border-transparent`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  <span className={`${config.color} capitalize`}>{type}</span>
                </div>
              );
            })}
          </motion.div>

          {/* Full Week Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {weeklySchedule.map((daySchedule, dayIndex) => (
              <motion.div
                key={daySchedule.day}
                custom={dayIndex}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: (i: number) => ({
                    opacity: 1,
                    y: 0,
                    rotate: [0, -2, 2, -1, 1, -0.4, 0.4, 0],
                    transition: {
                      opacity: { duration: 0.35, delay: i * 0.08 },
                      y: { duration: 0.4, delay: i * 0.08 },
                      rotate: { duration: 0.55, delay: i * 0.08 + 0.35, ease: 'easeInOut' },
                    },
                  }),
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: '-50px' }}
                className="bg-white overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-orange-400 tracking-[0.15em] uppercase">{daySchedule.shortDay}</span>
                    <span className="text-white font-bold text-sm">{daySchedule.day}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 bg-white/10 px-2 py-0.5 rounded-full font-medium">
                    {daySchedule.classes.length} {daySchedule.classes.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {/* Classes */}
                <div className="divide-y divide-gray-50">
                  {daySchedule.classes.map((classItem) => {
                    const typeConfig = classTypeConfig[classItem.type];
                    const Icon = typeConfig.icon;
                    return (
                      <div
                        key={`${daySchedule.day}-${classItem.time}`}
                        className="flex items-center gap-4 px-5 py-3.5 group hover:bg-orange-50/50 transition-colors"
                      >
                        {/* Time */}
                        <span className="text-orange-500 font-bold text-xs w-16 flex-shrink-0 tabular-nums">
                          {classItem.time}
                        </span>

                        {/* Type icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}>
                          <Icon className={`w-3.5 h-3.5 ${typeConfig.color}`} />
                        </div>

                        {/* Name + duration */}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <p className="text-gray-900 font-semibold text-sm truncate group-hover:text-orange-600 transition-colors">
                            {classItem.name}
                          </p>
                          <span className="text-[11px] text-gray-400 font-medium flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full">
                            {classItem.duration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-7 py-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Users className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>All classes included with any active membership plan</span>
              </div>
              <Link
                href="/membership"
                className="text-orange-500 hover:text-orange-600 font-bold text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                Get Full Access
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-24 px-6 sm:px-12 lg:px-16 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
              Your First Class Awaits
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              No experience is needed. Bring your energy, and we will guide you through the session.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-7 rounded-full">
                  Join GemFitness
                </Button>
              </Link>
              <Link href="/trainers">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold text-lg px-10 py-7 rounded-full">
                  Meet the Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
