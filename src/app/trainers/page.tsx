'use client';

import { motion } from 'framer-motion';
import { Award, Users, TrendingUp, Target, Star, Calendar, Instagram, Facebook, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const trainers = [
  {
    name: 'Kwame Mensah',
    role: 'Head Strength Coach',
    specialty: 'Strength Training & Powerlifting',
    image: '/trainers/kwame.jpg',
    bio: 'With over 10 years of experience, Kwame specializes in building raw strength and power. Former national powerlifting champion.',
    certifications: ['NSCA-CSCS', 'USA Powerlifting Level 2', 'Precision Nutrition L1'],
    achievements: ['National Powerlifting Champion 2019', '500+ clients trained', 'Featured in Fitness Ghana Magazine'],
    social: { instagram: '@kwamefitness', facebook: 'kwamemensah' },
    available: ['Mon, Wed, Fri', '6:00 AM - 2:00 PM'],
  },
  {
    name: 'Sarah Johnson',
    role: 'Yoga & Wellness Expert',
    specialty: 'Yoga, Pilates & Mindfulness',
    image: '/trainers/sarah.jpg',
    bio: 'Sarah brings holistic wellness through movement and mindfulness. Certified in multiple yoga styles and breathwork.',
    certifications: ['RYT-500', 'Pilates Mat Certification', 'Meditation Teacher'],
    achievements: ['1000+ yoga hours taught', 'Wellness retreat facilitator', 'Corporate wellness consultant'],
    social: { instagram: '@sarahyogagh', facebook: 'sarahjohnsonyoga' },
    available: ['Tue, Thu, Sat', '7:00 AM - 6:00 PM'],
  },
  {
    name: 'Mike Chen',
    role: 'HIIT & Conditioning Specialist',
    specialty: 'HIIT, Bootcamp & Athletic Performance',
    image: '/trainers/mike.jpg',
    bio: 'High-intensity is Mike\'s game. Former CrossFit athlete turned coach, he pushes you to discover your peak performance.',
    certifications: ['CrossFit Level 2', 'NASM-PES', 'FMS Level 2'],
    achievements: ['CrossFit Regional Competitor', '300+ bootcamp sessions led', 'Sports performance coach'],
    social: { instagram: '@mikechen_fit', facebook: 'mikechentraining' },
    available: ['Mon-Fri', '5:00 AM - 1:00 PM'],
  },
  {
    name: 'Marcus Williams',
    role: 'Boxing & Combat Coach',
    specialty: 'Boxing, Kickboxing & MMA',
    image: '/trainers/marcus.jpg',
    bio: 'Former professional boxer with a passion for teaching the sweet science. Marcus combines technique with explosive conditioning.',
    certifications: ['Boxing Coach Level 3', 'Kickboxing Instructor', 'CPR/First Aid'],
    achievements: ['15-2 pro boxing record', 'Trained 5 amateur champions', 'Self-defense workshop leader'],
    social: { instagram: '@marcuswilliamsboxing', facebook: 'marcuswilliamscoach' },
    available: ['Mon, Wed, Fri', '4:00 PM - 9:00 PM'],
  },
  {
    name: 'Ama Osei',
    role: 'Nutrition & Wellness Coach',
    specialty: 'Nutrition, Weight Management & Lifestyle',
    image: '/trainers/ama.jpg',
    bio: 'Ama believes fitness starts in the kitchen. She helps clients build sustainable nutrition habits for lasting results.',
    certifications: ['Registered Dietitian', 'Precision Nutrition L2', 'Behavior Change Specialist'],
    achievements: ['500+ nutrition plans created', 'Weight loss success rate: 87%', 'Published nutrition researcher'],
    social: { instagram: '@amaosei_nutrition', facebook: 'amaoseiwellness' },
    available: ['Mon-Thu', '9:00 AM - 5:00 PM'],
  },
  {
    name: 'David Appiah',
    role: 'Rehabilitation Specialist',
    specialty: 'Injury Prevention & Recovery',
    image: '/trainers/david.jpg',
    bio: 'David specializes in getting athletes back to peak performance after injury. Combines physical therapy with strength training.',
    certifications: ['Physical Therapist (DPT)', 'CSCS', 'TPI Golf Fitness'],
    achievements: ['10+ years clinical experience', 'Worked with pro athletes', 'Injury prevention workshops'],
    social: { instagram: '@davidappiah_pt', facebook: 'davidappiahpt' },
    available: ['Tue, Thu, Sat', '8:00 AM - 4:00 PM'],
  },
];

const certificationInfo = [
  {
    category: 'Strength & Conditioning',
    certs: ['NSCA-CSCS', 'NASM-CPT', 'USA Weightlifting', 'Powerlifting Coach'],
    icon: Award,
  },
  {
    category: 'Specialized Training',
    certs: ['CrossFit Certified', 'Boxing Coach', 'Yoga Alliance (RYT)', 'Pilates Instructor'],
    icon: Target,
  },
  {
    category: 'Health & Nutrition',
    certs: ['Registered Dietitian', 'Precision Nutrition', 'Behavior Change Specialist'],
    icon: TrendingUp,
  },
  {
    category: 'Safety & First Aid',
    certs: ['CPR/AED Certified', 'First Aid', 'Emergency Response', 'Injury Prevention'],
    icon: Users,
  },
];

export default function TrainersPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Our Team"
        title="Meet Your Coaches"
        description="World-class trainers dedicated to helping you achieve your fitness goals. Every coach brings unique expertise and passion."
      />

      {/* Trainers Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-orange-500">Expert Team</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each trainer is certified, experienced, and committed to your success. Click to learn more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainers.map((trainer, index) => (
              <motion.div
                key={trainer.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/50 transition-all duration-300 overflow-hidden group cursor-pointer h-full">
                  {/* Image */}
                  <div className="relative h-64 bg-gradient-to-br from-orange-500/20 to-transparent overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-24 h-24 text-white/20" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{trainer.name}</h3>
                      <p className="text-orange-500 font-semibold">{trainer.role}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <Star className="w-4 h-4 text-orange-500" />
                        <span>{trainer.specialty}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3">{trainer.bio}</p>

                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-900 mb-2">Top Achievements:</div>
                      <ul className="space-y-1">
                        {trainer.achievements.slice(0, 2).map((achievement) => (
                          <li key={achievement} className="flex items-start space-x-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span>{trainer.available[0]} • {trainer.available[1]}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors">
                          <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors">
                          <Facebook className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors">
                          <Mail className="w-5 h-5" />
                        </a>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Book Session
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Certified <span className="text-orange-500">Excellence</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our trainers hold industry-leading certifications and continuously update their knowledge.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {certificationInfo.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 p-6 h-full">
                  <category.icon className="w-12 h-12 text-orange-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{category.category}</h3>
                  <ul className="space-y-2">
                    {category.certs.map((cert) => (
                      <li key={cert} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Philosophy */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Training <span className="text-orange-500">Philosophy</span>
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Approach</h3>
                  <p className="text-gray-600">
                    Every body is unique. We create customized programs that align with your goals, fitness level, and lifestyle.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Science-Based Training</h3>
                  <p className="text-gray-600">
                    Our methods are grounded in exercise science, biomechanics, and the latest research in sports performance.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainable Results</h3>
                  <p className="text-gray-600">
                    We focus on building long-term habits, not quick fixes. Your success today becomes your lifestyle tomorrow.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Continuous Support</h3>
                  <p className="text-gray-600">
                    Beyond the gym floor, our trainers provide nutrition guidance, accountability, and motivation to keep you on track.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30 p-8">
                <div className="text-center mb-6">
                  <Award className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Why Choose Our Trainers?</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Average 8+ years of coaching experience',
                    'Continuing education required annually',
                    'Specialized in multiple training modalities',
                    'Proven track record of client transformations',
                    'Background-checked and insured',
                    'Passionate about your success',
                  ].map((point) => (
                    <li key={point} className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Book a <span className="text-orange-500">Personal Session</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ready to work one-on-one with a trainer? Fill out the form below and we&apos;ll match you with the perfect coach.
            </p>
          </motion.div>

          <Card className="bg-white border-gray-200 p-8">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder="+233 XXX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Preferred Trainer</label>
                  <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500">
                    <option value="">Any Available</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.name} value={trainer.name}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Fitness Goals</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  placeholder="Tell us about your fitness goals and what you hope to achieve..."
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg py-6">
                Request Consultation
              </Button>
            </form>
          </Card>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Not Ready for Personal Training?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Join our group classes and experience expert coaching in a motivating community environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/classes">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6">
                  View Class Schedule
                </Button>
              </Link>
              <Link href="/membership">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-6">
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

