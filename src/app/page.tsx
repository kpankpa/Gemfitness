'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Users,
  Trophy,
  Calendar,
  Target,
  Star,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Play,
  ChevronDown,
  MessageCircle,
  Heart,
  ArrowRight,
  Plus,
  Minus,
  Send,
  User,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

// Sample data
const trainingVideos = [
  { id: 1, title: 'HIIT Bootcamp', category: 'High Intensity', duration: '45 min', intensity: 'Advanced', thumbnail: '/images/hiit.jpg' },
  { id: 2, title: 'Strength Training', category: 'Strength', duration: '60 min', intensity: 'Intermediate', thumbnail: '/images/strength.jpg' },
  { id: 3, title: 'Cardio Blast', category: 'Cardio', duration: '30 min', intensity: 'Beginner', thumbnail: '/images/cardio.jpg' },
  { id: 4, title: 'Core Power', category: 'Core', duration: '20 min', intensity: 'All Levels', thumbnail: '/images/core.jpg' },
  { id: 5, title: 'Boxing Fitness', category: 'Boxing', duration: '45 min', intensity: 'Intermediate', thumbnail: '/images/boxing.jpg' },
  { id: 6, title: 'Yoga Flow', category: 'Flexibility', duration: '30 min', intensity: 'Beginner', thumbnail: '/images/yoga.jpg' },
];

const trainers = [
  { name: 'Kwame Mensah', specialty: 'Strength & Conditioning', experience: '8 years', motto: 'Push Your Limits', image: '/images/trainer1.jpg' },
  { name: 'Ama Asante', specialty: 'HIIT & Cardio', experience: '5 years', motto: 'Sweat is Just Fat Crying', image: '/images/trainer2.jpg' },
  { name: 'Kofi Boateng', specialty: 'Boxing & Combat', experience: '10 years', motto: 'Train Like a Champion', image: '/images/trainer3.jpg' },
  { name: 'Akua Owusu', specialty: 'Yoga & Wellness', experience: '6 years', motto: 'Mind, Body, Spirit', image: '/images/trainer4.jpg' },
];

const testimonials = [
  {
    name: 'Nana Yaw',
    role: 'Business Owner',
    image: '/images/member1.jpg',
    quote: 'GemFitness changed my life! Lost 15kg in 4 months. The trainers are incredible and the community is so supportive.',
    rating: 5,
    beforeAfter: { before: '/images/before1.jpg', after: '/images/after1.jpg' }
  },
  {
    name: 'Abena Osei',
    role: 'Teacher',
    image: '/images/member2.jpg',
    quote: 'Best gym in Tema! The equipment is modern, the facility is always clean, and the energy is unmatched. Highly recommend!',
    rating: 5,
    beforeAfter: { before: '/images/before2.jpg', after: '/images/after2.jpg' }
  },
  {
    name: 'Kwasi Appiah',
    role: 'Engineer',
    image: '/images/member3.jpg',
    quote: 'As someone who travels, the flexible hours are perfect. Early morning sessions before work are my favorite. Great investment!',
    rating: 5,
    beforeAfter: { before: '/images/before3.jpg', after: '/images/after3.jpg' }
  },
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
  const [bmiWeight, setBmiWeight] = useState('');
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiResult, setBmiResult] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  
  const memberCount = 500; // Static member count

  const calculateBMI = () => {
    const weight = parseFloat(bmiWeight);
    const height = parseFloat(bmiHeight) / 100; // convert cm to m
    if (weight > 0 && height > 0) {
      const bmi = weight / (height * height);
      setBmiResult(Math.round(bmi * 10) / 10);
      
      if (bmi < 18.5) setBmiCategory('Underweight');
      else if (bmi < 25) setBmiCategory('Healthy');
      else if (bmi < 30) setBmiCategory('Overweight');
      else setBmiCategory('Obese');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you! We will contact you soon.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Modern Light Design */}
      <section className="relative min-h-[calc(100vh-5rem)] sm:min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF6B00_1px,transparent_1px),linear-gradient(to_bottom,#FF6B00_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6 font-semibold"
              >
                <Trophy className="h-5 w-5" />
                <span>We&apos;re What We Eat!</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-gray-900">
                Transform Your <span className="text-orange-500">Body & Mind</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl">
                Join <strong className="text-orange-500 font-bold">{memberCount}+ members</strong> at Tema&apos;s premier fitness destination. 
                Professional trainers, modern equipment, and a supportive community await.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
                <Button asChild size="lg" className="text-base sm:text-lg group bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto touch-manipulation">
                  <Link href="/signup?plan=quarterly">
                    Join Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base sm:text-lg border-2 border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-500 font-semibold h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto touch-manipulation">
                  <Link href="#videos">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Classes
                  </Link>
                </Button>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-md">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">{memberCount}+</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">16</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Hours Daily</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">5★</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Rated</div>
                </div>
              </div>
            </motion.div>

            {/* Hero Image Placeholder with Animated Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-orange-300" />
              
              {/* Floating Stats Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 bg-white p-4 rounded-xl shadow-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">1,250</div>
                    <div className="text-xs text-gray-600 font-medium">Calories Burned</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-10 bg-white p-4 rounded-xl shadow-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">145 BPM</div>
                    <div className="text-xs text-gray-600 font-medium">Heart Rate</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-gray-400" />
        </motion.div>
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

      {/* Training Videos Section */}
      <section id="videos" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-14 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900"
            >
              Explore Our <span className="text-orange-500">Training Programs</span>
            </motion.h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              From high-intensity workouts to mindful yoga, find the perfect class for your fitness journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-orange-500/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 p-4 rounded-full group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    <div className="absolute top-3 left-3 bg-primary text-white text-xs px-2 py-1 rounded font-semibold">
                      {video.intensity}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{video.title}</CardTitle>
                    <CardDescription>{video.category}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button asChild size="lg" variant="glow">
              <Link href="/signup">View All Classes & Join Today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trainers Section */}
      <section id="trainers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900"
            >
              Meet Your <span className="text-orange-500">Expert Trainers</span>
            </motion.h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Certified professionals dedicated to helping you achieve your fitness goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trainers.map((trainer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow border-2 border-gray-100 hover:border-orange-200">
                  <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="h-24 w-24 text-orange-300" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900">{trainer.name}</CardTitle>
                    <CardDescription>
                      <div className="text-orange-500 font-semibold mb-1">{trainer.specialty}</div>
                      <div className="text-sm text-gray-600">{trainer.experience} experience</div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="italic text-gray-600">&ldquo;{trainer.motto}&rdquo;</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold">
                      <Link href="/signup">Book a Session</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-heading font-bold mb-4">
              Why Choose <span className="text-gradient">GemFitness</span>?
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Everything you need to succeed in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                icon: Calendar,
                title: "Flexible Classes",
                description: "Group sessions, personal training, and open gym hours",
                gradient: "from-purple-500 to-pink-500"
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
              {
                icon: Trophy,
                title: "Community Challenges",
                description: "Monthly competitions and rewards to keep you motivated",
                gradient: "from-pink-500 to-rose-500"
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="h-full border-2 border-gray-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  <CardHeader className="space-y-4">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories / Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-heading font-bold mb-4">
              Real Members, <span className="text-gradient">Real Results</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Hear from our community about their transformation journey at GemFitness.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.role}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-700 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BMI Calculator Tool */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-orange-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">
              Calculate Your <span className="text-gradient">BMI</span>
            </h2>
            <p className="text-lg text-neutral-600">
              Get started with a quick health assessment
            </p>
          </div>

          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Body Mass Index Calculator</CardTitle>
              <CardDescription>Enter your measurements below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={bmiWeight}
                  onChange={(e) => setBmiWeight(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={bmiHeight}
                  onChange={(e) => setBmiHeight(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="170"
                />
              </div>
              <Button onClick={calculateBMI} className="w-full" variant="glow">
                Calculate BMI
              </Button>

              {bmiResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-6 bg-primary/10 rounded-lg text-center"
                >
                  <div className="text-4xl font-bold text-primary mb-2">{bmiResult}</div>
                  <div className="text-lg font-semibold mb-1">{bmiCategory}</div>
                  <p className="text-sm text-neutral-600">
                    Join GemFitness to achieve your ideal weight!
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
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
            {[
              {
                name: "Monthly",
                price: 200,
                period: "per month",
                features: [
                  "Full gym access",
                  "All equipment",
                  "Group classes",
                  "Locker facility",
                  "Shower & changing rooms",
                ],
                popular: false,
              },
              {
                name: "Quarterly",
                price: 500,
                period: "per 3 months",
                savings: "Save GH₵100",
                features: [
                  "Everything in Monthly",
                  "Priority booking",
                  "1 free personal training session",
                  "Nutrition consultation",
                  "Progress tracking",
                ],
                popular: true,
              },
              {
                name: "Annual",
                price: 2200,
                period: "per year",
                savings: "Save GH₵200",
                features: [
                  "Everything in Quarterly",
                  "Unlimited personal training",
                  "Exclusive member events",
                  "Bring-a-friend days",
                  "Free merchandise",
                ],
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
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
                {plan.popular && (
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
                  plan.popular 
                    ? 'border-2 border-orange-500 shadow-2xl shadow-orange-500/30 scale-105' 
                    : 'border-2 border-gray-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/20'
                }`}>
                  {/* Gradient Background Effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    plan.popular 
                      ? 'bg-gradient-to-br from-orange-50 via-white to-orange-50' 
                      : 'bg-gradient-to-br from-orange-50/50 via-white to-white'
                  }`} />

                  {plan.popular && (
                    <>
                      {/* Corner Accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full z-0" />
                    </>
                  )}

                  <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                    <CardDescription>
                      <motion.div 
                        className="mt-4"
                        initial={{ scale: 0.9 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-gray-600"> {plan.period}</span>
                      </motion.div>
                      {plan.savings && (
                        <div className="mt-2 text-orange-600 font-semibold">{plan.savings}</div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Divider */}
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent relative z-10" />
                  
                  <CardContent className="relative z-10 pt-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <motion.li 
                          key={j} 
                          className="flex items-start gap-2"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + (j * 0.05) }}
                        >
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="h-3 w-3 text-orange-600" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="relative z-10">
                    <motion.div 
                      className="w-full"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        asChild 
                        className={`w-full text-lg py-6 font-semibold shadow-lg transition-all duration-300 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/50 text-white'
                            : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-orange-500 hover:to-orange-600 text-white hover:shadow-orange-500/50'
                        }`}
                      >
                        <Link href={`/signup?plan=${plan.name.toLowerCase()}`}>Choose {plan.name}</Link>
                      </Button>
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center bg-primary/10 border border-primary/20 rounded-lg p-6">
            <p className="text-neutral-700">
              <strong>One-time registration fee:</strong> {formatCurrency(250)} (includes welcome kit & fitness assessment)
            </p>
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 relative overflow-hidden">
        {/* Background Pattern for depth */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-pulse" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold mb-6 text-white drop-shadow-lg"
          >
            Ready to Transform Your Life?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-10 text-white font-medium drop-shadow-md leading-relaxed"
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
            <Button asChild size="lg" className="text-lg bg-white text-orange-600 hover:bg-gray-100 font-bold shadow-xl">
              <Link href="/signup">Start Your Journey</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold shadow-xl">
              <Link href="#contact">Contact Us</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-heading font-bold mb-6">
                Get in <span className="text-gradient">Touch</span>
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                Have questions? We&apos;re here to help. Send us a message or visit us in person.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <p className="text-neutral-600">Tema, Gbestile, Ghana</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <a href="tel:+233249003832" className="text-primary hover:underline">
                      +233 24 900 3832
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:info@gemfitness.com" className="text-primary hover:underline">
                      info@gemfitness.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Hours</h3>
                    <p className="text-neutral-600">Mon-Fri: 5:00 AM - 10:00 PM</p>
                    <p className="text-neutral-600">Sat: 6:00 AM - 9:00 PM</p>
                    <p className="text-neutral-600">Sun: 7:00 AM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>We&apos;ll get back to you within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Tell us about your fitness goals..."
                    />
                  </div>
                  <Button type="submit" className="w-full" variant="glow">
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
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
        ></iframe>
      </section>
    </div>
  );
}
