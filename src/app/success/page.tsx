'use client';

import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, Heart, Award, Quote, Play, Star, Calendar, Target, Users } from 'lucide-react';
import Link from 'next/link';

const transformations = [
  {
    name: 'Ama Darko',
    age: 32,
    goal: 'Weight Loss',
    duration: '6 months',
    result: 'Lost 25kg',
    before: '/images/before1.jpg',
    after: '/images/after1.jpg',
    quote: 'I never thought I could achieve this. The trainers at GemFitness believed in me when I didn&apos;t believe in myself.',
    stats: { weight: '-25kg', body_fat: '-12%', energy: '+200%' },
  },
  {
    name: 'Kwabena Osei',
    age: 28,
    goal: 'Muscle Gain',
    duration: '8 months',
    result: 'Gained 15kg muscle',
    before: '/images/before2.jpg',
    after: '/images/after2.jpg',
    quote: 'From skinny to strong! The personalized training and nutrition plan made all the difference.',
    stats: { muscle: '+15kg', strength: '+80%', confidence: '+300%' },
  },
  {
    name: 'Efua Mensah',
    age: 45,
    goal: 'Health & Wellness',
    duration: '12 months',
    result: 'Reversed pre-diabetes',
    before: '/images/before3.jpg',
    after: '/images/after3.jpg',
    quote: 'My doctor was amazed at my blood work. GemFitness literally saved my life.',
    stats: { blood_sugar: '-40%', cholesterol: '-35%', medication: '-100%' },
  },
  {
    name: 'Kofi Appiah',
    age: 51,
    goal: 'Functional Fitness',
    duration: '10 months',
    result: 'Back pain free',
    before: '/images/before4.jpg',
    after: '/images/after4.jpg',
    quote: 'After years of chronic back pain, I can now play with my grandkids. Life-changing!',
    stats: { pain: '-100%', mobility: '+150%', quality_of_life: '+500%' },
  },
  {
    name: 'Abena Frimpong',
    age: 26,
    goal: 'Athletic Performance',
    duration: '5 months',
    result: 'Marathon finisher',
    before: '/images/before5.jpg',
    after: '/images/after5.jpg',
    quote: 'Went from couch to completing my first marathon. The cardio and strength training was key.',
    stats: { endurance: '+250%', race_time: '4:15:22', races_completed: '3' },
  },
  {
    name: 'Samuel Agyei',
    age: 38,
    goal: 'Lifestyle Change',
    duration: '18 months',
    result: 'Complete transformation',
    before: '/images/before6.jpg',
    after: '/images/after6.jpg',
    quote: 'It&apos;s not just about looking good, it&apos;s about feeling alive again. Best investment I&apos;ve ever made.',
    stats: { weight: '-32kg', energy: '+300%', life_quality: 'Immeasurable' },
  },
];

const testimonials = [
  {
    name: 'Grace Owusu',
    role: 'Marketing Executive',
    quote: 'GemFitness changed my life. The community is incredibly supportive, and the trainers are world-class.',
    rating: 5,
    image: '/images/testimonial1.jpg',
  },
  {
    name: 'Patrick Mensah',
    role: 'Software Developer',
    quote: 'Best gym in Tema! Modern equipment, knowledgeable staff, and flexible class schedule.',
    rating: 5,
    image: '/images/testimonial2.jpg',
  },
  {
    name: 'Jennifer Adu',
    role: 'Teacher',
    quote: 'The yoga classes here are phenomenal. Sarah is an incredible instructor who creates a welcoming space.',
    rating: 5,
    image: '/images/testimonial3.jpg',
  },
  {
    name: 'Michael Boateng',
    role: 'Entrepreneur',
    quote: 'I&apos;ve tried many gyms, but GemFitness stands out. The personal training sessions are worth every cedi.',
    rating: 5,
    image: '/images/testimonial4.jpg',
  },
];

const caseStudies = [
  {
    title: 'From Sedentary to Strong',
    category: 'Weight Loss Journey',
    member: 'Ama D.',
    duration: '6 months',
    challenge: 'Ama came to us with a desk job, unhealthy eating habits, and zero exercise routine. She was pre-diabetic and feeling exhausted all the time.',
    solution: 'We designed a progressive strength training program combined with HIIT classes 3x/week, plus nutritional coaching focusing on whole foods.',
    results: [
      'Lost 25kg of body fat',
      'Gained 4kg of lean muscle',
      'Blood sugar normalized',
      'Energy levels skyrocketed',
      'Stopped taking medication (doctor-approved)',
    ],
    quote: 'I have my life back. I can keep up with my kids, I sleep better, and I actually love working out now!',
  },
  {
    title: 'Athletic Performance Unleashed',
    category: 'Strength & Power',
    member: 'Kwabena O.',
    duration: '8 months',
    challenge: 'Despite being active, Kwabena couldn&apos;t build muscle or increase strength. He was frustrated with his plateau.',
    solution: 'We implemented a periodized strength program with compound lifts, optimized his protein intake to 2g/kg, and added recovery protocols.',
    results: [
      'Squat increased from 60kg to 140kg',
      'Bench press from 50kg to 100kg',
      'Gained 15kg of lean muscle',
      'Body fat dropped from 20% to 12%',
      'Competed in first powerlifting meet',
    ],
    quote: 'The science-based approach and attention to detail made all the difference. I&apos;m stronger than I ever thought possible.',
  },
];

const milestones = [
  { number: '2,500+', label: 'Success Stories', icon: Heart },
  { number: '15,000kg', label: 'Total Weight Lost', icon: TrendingUp },
  { number: '98%', label: 'Member Satisfaction', icon: Star },
  { number: '50+', label: 'Marathon Finishers', icon: Award },
];

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Success Stories"
        title="Real Results, Real People"
        description="Meet the inspiring members who transformed their lives at GemFitness. Your success story starts here."
      />

      {/* Community Milestones */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <Card className="bg-white border-gray-200 p-6">
                  <milestone.icon className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                    {milestone.number}
                  </div>
                  <div className="text-sm text-gray-600">{milestone.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation Stories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Amazing <span className="text-orange-500">Transformations</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These incredible journeys prove that with dedication, expert guidance, and the right support, anything is possible.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {transformations.map((story, index) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/50 transition-all overflow-hidden h-full">
                  {/* Before/After Images */}
                  <div className="relative h-64 bg-gradient-to-br from-orange-500/20 to-transparent">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Users className="w-20 h-20 text-white/20 mx-auto mb-4" />
                        <div className="flex gap-4 text-sm font-semibold">
                          <span className="text-gray-600">BEFORE</span>
                          <span className="text-orange-500">→</span>
                          <span className="text-orange-500">AFTER</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{story.name}</h3>
                        <p className="text-sm text-gray-600">Age {story.age} • {story.duration}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase">Result</div>
                        <div className="text-lg font-bold text-orange-500">{story.result}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <Target className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Goal: {story.goal}</span>
                    </div>

                    <div className="relative mb-4">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-orange-500/20" />
                      <p className="text-gray-700 italic pl-6">&quot;{story.quote}&quot;</p>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {Object.entries(story.stats).map(([key, value]) => (
                          <div key={key}>
                            <div className="text-xl font-bold text-orange-500">{value}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {key.replace('_', ' ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Video <span className="text-orange-500">Testimonials</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear directly from our members about their experience at GemFitness.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/50 transition-all overflow-hidden group cursor-pointer h-full">
                  <div className="relative h-48 bg-gradient-to-br from-orange-500/20 to-transparent">
                    <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/50 transition-all">
                      <Play className="w-16 h-16 text-white opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-orange-500 fill-orange-500" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">&quot;{testimonial.quote}&quot;</p>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                      <div className="text-xs text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Case Studies */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              In-Depth <span className="text-orange-500">Case Studies</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Detailed breakdowns of transformation journeys, including the challenges, strategies, and results.
            </p>
          </motion.div>

          <div className="space-y-8">
            {caseStudies.map((study, index) => (
              <motion.div
                key={study.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/30 transition-all overflow-hidden">
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="lg:w-2/3">
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-xs font-semibold rounded-full">
                            {study.category}
                          </span>
                          <span className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {study.duration}
                          </span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{study.title}</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-orange-500 uppercase mb-2">The Challenge</h4>
                            <p className="text-gray-700">{study.challenge}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-orange-500 uppercase mb-2">Our Solution</h4>
                            <p className="text-gray-700">{study.solution}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-orange-500 uppercase mb-2">Results</h4>
                            <ul className="space-y-2">
                              {study.results.map((result) => (
                                <li key={result} className="flex items-start space-x-2">
                                  <Award className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                                  <span className="text-gray-700">{result}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-1/3">
                        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30 p-6">
                          <Quote className="w-12 h-12 text-orange-500/40 mb-4" />
                          <p className="text-gray-700 italic mb-4">&quot;{study.quote}&quot;</p>
                          <div className="text-sm text-gray-500">- {study.member}</div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
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
            <TrendingUp className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Join our community of achievers. Your transformation starts with a single decision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/membership">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/trainers">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-6">
                  Talk to a Trainer
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

