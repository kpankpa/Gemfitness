'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, CheckCircle2, Heart, Video, Award, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

type TrainerCard = {
  name: string;
  specialty: string;
  bio: string;
  certifications: string[];
  image: string;
  imgClass: string;
  imgBg: string;
};

const FALLBACK_TRAINERS: TrainerCard[] = [
  {
    name: 'Instructor Fireman',
    specialty: 'Strength & Conditioning',
    bio: 'The original. The standard. Fireman brings focus and intensity to every session. His coaching shows what consistent hard work looks like.',
    certifications: ['Strength Coach', 'Conditioning Specialist', 'Nutrition'],
    image: '/trainers/instructor_Fireman.jpeg',
    imgClass: 'object-contain object-center',
    imgBg: 'bg-gray-100',
  },
  {
    name: 'Instructor Alby',
    specialty: 'HIIT & Cardio',
    bio: 'Zero excuses, maximum output. Alby turns your limits into starting points. You\'ll sweat harder, move faster, and leave every session a better version of yourself.',
    certifications: ['ACE Certified', 'HIIT Specialist', 'TRX Instructor'],
    image: '/trainers/instructor_Alby.jpeg',
    imgClass: 'object-cover object-top',
    imgBg: '',
  },
  {
    name: 'Instructor Fred',
    specialty: 'Boxing & Combat',
    bio: 'In the ring or on the floor, Fred is relentless. He builds physical strength and mental discipline. Expect demanding workouts that test your limits.',
    certifications: ['Boxing Coach', 'Combat Conditioning', 'FMS Certified'],
    image: '/trainers/instructor_Fred.jpeg',
    imgClass: 'object-cover object-top',
    imgBg: '',
  },
  {
    name: 'Official Energy',
    specialty: 'Dance & Aerobics',
    bio: 'Official Energy runs lively classes that make movement feel natural. You may find yourself dancing before you realise you are working out.',
    certifications: ['Zumba Licensed', 'Aerobics Instructor', 'Group Fitness'],
    image: '/trainers/official_energy.jpeg',
    imgClass: 'object-cover object-top',
    imgBg: '',
  },
];

function mapApiTrainer(t: {
  name: string;
  specializations?: string[];
  bio?: string | null;
  certifications?: string[];
  image?: string | null;
}): TrainerCard {
  const known = FALLBACK_TRAINERS.find(
    (f) => f.name.toLowerCase() === t.name.toLowerCase()
  );
  return {
    name: t.name,
    specialty: t.specializations?.[0] || known?.specialty || 'Coach',
    bio: t.bio || known?.bio || '',
    certifications: t.certifications?.length
      ? t.certifications
      : known?.certifications || [],
    image: t.image || known?.image || '/images/training_at_gem.png',
    imgClass: known?.imgClass || 'object-cover object-top',
    imgBg: known?.imgBg || '',
  };
}

export default function OurTeamPage() {
  const [trainers, setTrainers] = useState<TrainerCard[]>(FALLBACK_TRAINERS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/public/trainers');
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.trainers) && data.trainers.length) {
          setTrainers(data.trainers.map(mapApiTrainer));
        }
      } catch {
        // Keep fallback trainers
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative h-[60vh] sm:h-[65vh] lg:h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/training_at_gem.png"
            alt="Our Team at GemFitness"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="max-w-3xl"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block text-orange-400 font-medium tracking-[0.25em] text-xs sm:text-sm uppercase mb-6 border-l-2 border-orange-400 pl-4"
            >
              GemFitness
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-6"
            >
              <span
                className="block text-6xl sm:text-7xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter"
                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}
              >
                OUR
              </span>
              <span
                className="block text-6xl sm:text-7xl md:text-8xl font-black leading-[0.85] tracking-tighter bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
              >
                TEAM
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-base sm:text-lg md:text-xl text-white/80 font-light leading-relaxed max-w-xl"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
            >
              Focused coaching, hard training, and measurable progress.
            </motion.p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[80px] block" preserveAspectRatio="none">
            <path d="M0,40 C320,80 640,20 960,40 C1120,50 1280,60 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── HAND-SELECTED ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] sm:h-[500px] lg:h-[560px] overflow-hidden rounded-lg"
            >
              <Image
                src="/images/training_at_gem.jpg"
                alt="Personal training at GemFitness"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1] tracking-tight mb-8">
                Built different.<br />
                Trained harder.<br />
                <span className="text-orange-500">Here for your results.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Forget average trainers. At GemFitness, we hunt for the best coaches in Ghana,
                put them through a process that weeds out the weak, and unleash them on your goals.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every single person on this team is locked in on{' '}
                <strong className="text-gray-900">one goal: your progress</strong>.
                From session one, you feel the difference immediately.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── RIGOROUS RECRUITMENT ──────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">
                Rigorous Recruitment
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                We don&apos;t hire trainers.<br />We hunt for them.
              </h2>
              <p className="text-xl text-gray-700 font-medium mb-6">
                Hundreds apply. A handful survive. Only the elite earn a spot.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Every candidate faces a multi-stage process that goes way beyond qualifications.
                We test grit, obsession for results, how they handle pressure,
                and whether they genuinely live and breathe fitness.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Step onto the gym floor at GemFitness and you&apos;re working with one of the most
                carefully selected coaches in Ghana. That standard guides every session.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] sm:h-[500px] overflow-hidden rounded-lg order-1 lg:order-2"
            >
              <Image
                src="/images/strength.png"
                alt="Trainer coaching a member"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CONTINUOUS DEVELOPMENT ────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] sm:h-[500px] overflow-hidden rounded-lg"
            >
              <Image
                src="/images/dance_class.png"
                alt="Training session at GemFitness"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">
                Relentless Education
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                Getting in is just the beginning
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Most trainers get certified and coast. Not here. At GemFitness, the moment you join the team,
                the real work starts, and consistency keeps it going.
              </p>
              <p className="text-gray-700 font-medium mb-6">
                Non-stop workshops, brutal assessments, mentorship from the top, and live coaching reviews.
                Our coaches are always sharpening their edge so yours stays sharp too.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You&apos;re not training with yesterday&apos;s knowledge. You&apos;re training with a coach at the absolute peak of their game.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meet the coaches */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">
              The Coaches
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              The people who will change your life
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-10">
            {trainers.map((trainer, index) => (
              <motion.div
                key={trainer.name}
                custom={index}
                variants={{
                  hidden: { opacity: 0, y: 40, rotate: 0 },
                  visible: (i: number) => ({
                    opacity: 1,
                    y: 0,
                    rotate: [0, -2.5, 2.5, -1.5, 1.5, -0.5, 0.5, 0],
                    transition: {
                      opacity: { duration: 0.4, delay: i * 0.12 },
                      y: { duration: 0.5, delay: i * 0.12 },
                      rotate: { duration: 0.6, delay: i * 0.12 + 0.45, ease: 'easeInOut' },
                    },
                  }),
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: '-60px' }}
                className="group"
              >
                {/* Image */}
                <div className={`relative h-72 sm:h-80 overflow-hidden mb-5 ${trainer.imgBg}`}>
                  <Image
                    src={trainer.image}
                    alt={trainer.name}
                    fill
                    className={`transition-transform duration-500 group-hover:scale-105 ${trainer.imgClass}`}
                  />
                  {/* Subtle bottom fade only */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                </div>

                {/* Card content */}
                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1 group-hover:text-orange-500 transition-colors">
                  {trainer.name}
                </h3>
                <p className="text-orange-500 font-bold text-xs uppercase tracking-wider mb-3">
                  {trainer.specialty}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {trainer.bio}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {trainer.certifications.map((cert) => (
                    <span key={cert} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-medium rounded">
                      {cert}
                    </span>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center text-orange-500 font-bold text-sm hover:text-orange-600 transition-colors group/link"
                >
                  BOOK A SESSION
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREATIVE TEAM ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-orange-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">
                Beyond Training
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                Your transformation,<br />
                <span className="text-orange-500">on camera. For the world.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Your grind deserves to be seen. That&apos;s why we embed a dedicated videographer
                inside GemFitness, so important moments are documented.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                The sweat. The breakthroughs. The moments you didn&apos;t think you had in you.
                We capture it in high-quality video that reflects the work you put in.
              </p>

              <div className="space-y-3">
                {[
                  'Cinematic training videos',
                  'Transformation documentation',
                  'Social media content creation',
                  'Before & after comparisons',
                  'Professional event coverage',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Videographer card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="group">
                {/* Videographer image */}
                <div className="relative h-72 sm:h-80 lg:h-96 overflow-hidden mb-5">
                  <Image
                    src="/images/videographer.jpeg"
                    alt="Clement Humphrey Amoatey"
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle bottom fade only */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content below image */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-orange-500 transition-colors">
                      Clement Humphrey Amoatey
                    </h3>
                    <p className="text-orange-500 font-bold text-xs uppercase tracking-wider mt-1">
                      Lead Videographer
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Video className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Clement documents each member&apos;s progress. His work ranges from short training edits to full transformation films.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center text-orange-500 font-bold text-sm hover:text-orange-600 transition-colors group/link"
                >
                  WORK WITH US
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHY OUR TEAM ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
              What makes this team untouchable
            </h2>
            <div className="w-20 h-1 bg-orange-500 mx-auto" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Results-Obsessed', description: 'Not satisfied until you hit your goal. Every session, every rep, every plan is built around YOUR outcome.' },
              { icon: Award, title: 'Elite Standard', description: 'Certified, relentlessly trained, battle-tested. These coaches operate at a level most people never see.' },
              { icon: Heart, title: 'All In For You', description: 'Your progress is personal to us. We celebrate your wins, push through your setbacks, and show up every time.' },
              { icon: Users, title: 'One Team', description: 'Coaches, creatives, and support staff work together to help you make progress.' },
            ].map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 text-center hover:shadow-lg transition-shadow border border-gray-100 hover:border-orange-200 rounded-lg"
              >
                <div className="w-14 h-14 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <point.icon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{point.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{point.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-12 lg:px-16 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-10 h-10 text-orange-500 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
              Stop waiting. Start transforming.
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              The team is ready. The equipment is ready. The only thing missing is you. Let&apos;s go.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-7 rounded-none">
                  Book Free Consultation
                </Button>
              </Link>
              <Link href="/classes">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold text-lg px-10 py-7 rounded-none">
                  View Class Schedule
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
