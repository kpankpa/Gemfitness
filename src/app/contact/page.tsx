'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from 'lucide-react';
import { useState } from 'react';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    details: ['Tema, Gbestile', 'Ghana'],
    action: 'Get Directions',
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['+233 (0) 123 456 789', '+233 (0) 987 654 321', 'WhatsApp Available'],
    action: 'Call Now',
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['info@gemfitness.com', 'support@gemfitness.com', 'careers@gemfitness.com'],
    action: 'Send Email',
  },
  {
    icon: Clock,
    title: 'Opening Hours',
    details: ['Mon-Fri: 5:00 AM - 10:00 PM', 'Sat: 7:00 AM - 8:00 PM', 'Sun: 7:00 AM - 6:00 PM'],
    action: '',
  },
];

const faqs = [
  {
    question: 'Do I need to book classes in advance?',
    answer: 'For most classes, you can walk in. However, we recommend booking popular classes (yoga, HIIT) through our app to guarantee your spot.',
  },
  {
    question: 'What should I bring for my first visit?',
    answer: 'Bring workout clothes, athletic shoes, a water bottle, and a towel. We provide lockers, showers, and basic toiletries.',
  },
  {
    question: 'Do you offer personal training?',
    answer: 'Yes! We have certified personal trainers available for one-on-one sessions. Book a consultation to discuss your goals and create a custom plan.',
  },
  {
    question: 'Is parking available?',
    answer: 'Yes, we have free parking for all members and visitors right outside the facility.',
  },
  {
    question: 'Can I bring a guest?',
    answer: 'Premium and Elite members receive guest passes. Basic members can purchase day passes for guests at reception.',
  },
  {
    question: 'Do you have showers and lockers?',
    answer: 'Yes! We have clean, spacious locker rooms with private showers, day lockers, and sauna facilities.',
  },
  {
    question: 'What COVID-19 safety measures are in place?',
    answer: 'We maintain enhanced cleaning protocols, provide hand sanitizer stations, and ensure proper ventilation throughout the facility.',
  },
  {
    question: 'Can I freeze my membership?',
    answer: 'Yes, you can freeze your membership for up to 3 months per year for a small administrative fee. Contact us to arrange.',
  },
];

const socialLinks = [
  { icon: Facebook, url: '#', label: '@GemFitnessGhana', color: 'hover:text-blue-500' },
  { icon: Instagram, url: '#', label: '@gemfitness_tema', color: 'hover:text-pink-500' },
  { icon: Twitter, url: '#', label: '@GemFitnessTema', color: 'hover:text-blue-400' },
  { icon: Youtube, url: '#', label: 'GemFitness TV', color: 'hover:text-red-500' },
];

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    // Simulate form submission
    setTimeout(() => {
      setFormStatus('sent');
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Contact Us"
        title="Get In Touch"
        description="Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
      />

      {/* Contact Info Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/50 transition-all p-6 h-full">
                  <info.icon className="w-10 h-10 text-orange-500 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{info.title}</h3>
                  <div className="space-y-1 mb-4">
                    {info.details.map((detail) => (
                      <p key={detail} className="text-sm text-gray-600">{detail}</p>
                    ))}
                  </div>
                  {info.action && (
                    <Button variant="outline" size="sm" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                      {info.action}
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Contact Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Send Us a <span className="text-orange-500">Message</span>
                </h2>
                <p className="text-gray-600">
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </p>
              </div>

              <Card className="bg-white border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="+233 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Subject *
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="">Select a subject</option>
                      <option value="membership">Membership Inquiry</option>
                      <option value="classes">Class Information</option>
                      <option value="personal-training">Personal Training</option>
                      <option value="corporate">Corporate Wellness</option>
                      <option value="facility">Facility Tour</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={formStatus !== 'idle'}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-6 disabled:opacity-50"
                  >
                    {formStatus === 'idle' && (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                    {formStatus === 'sending' && 'Sending...'}
                    {formStatus === 'sent' && '✓ Message Sent!'}
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Map & Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Map */}
              <Card className="bg-white border-gray-200 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-transparent">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.8076815780615!2d-0.0174!3d5.6698!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwNDAnMTEuMyJOIDDCsDAxJzAyLjYiVw!5e0!3m2!1sen!2sgh!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="GemFitness Location"
                  />
                </div>
              </Card>

              {/* Social Media */}
              <Card className="bg-white border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-gray-900">Follow Us</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Stay connected and get daily fitness tips, class updates, and member spotlights.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      className={`flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-all ${social.color}`}
                    >
                      <social.icon className="w-5 h-5" />
                      <span className="text-sm font-medium text-gray-700">{social.label}</span>
                    </a>
                  ))}
                </div>
              </Card>

              {/* Quick Response */}
              <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30 p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Need Immediate Help?</h3>
                  <p className="text-gray-600 mb-4">
                    Call us now for quick assistance
                  </p>
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    +233 (0) 123 456 789
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <HelpCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Frequently Asked <span className="text-orange-500">Questions</span>
            </h2>
            <p className="text-gray-600">
              Quick answers to common questions. Can&apos;t find what you&apos;re looking for? Contact us directly.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white border-gray-200 p-6 hover:border-orange-500/30 transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start">
                    <span className="text-orange-500 mr-2">Q:</span>
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 pl-6">
                    <span className="text-orange-500 font-semibold">A:</span> {faq.answer}
                  </p>
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
            <p className="text-gray-600 mb-4">
              Still have questions?
            </p>
            <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
              View Full FAQ
            </Button>
          </motion.div>
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
            <MapPin className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Visit Us Today!
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              See our facilities in person. Schedule a free tour and experience GemFitness yourself.
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
              Book Your Free Tour
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

