'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Instagram,
  Facebook,
  Twitter,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    details: ['Tema, Gbestile', 'Ghana'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['+233 (0) 123 456 789', 'WhatsApp Available'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['info@gemfitness.com'],
  },
  {
    icon: Clock,
    title: 'Hours',
    details: ['Mon–Fri: 5:00 AM – 10:00 PM', 'Sat: 7:00 AM – 8:00 PM', 'Sun: 7:00 AM – 6:00 PM'],
  },
];

const socialLinks = [
  { icon: Instagram, url: '#', label: '@gemfitness_tema' },
  { icon: Facebook, url: '#', label: 'GemFitness Ghana' },
  { icon: Twitter, url: '#', label: '@GemFitnessTema' },
];

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
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
        description="Questions about membership, classes, or anything else? We'd love to hear from you."
      />

      {/* Contact Info + Form */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-orange-500/30 transition-all p-5 h-full">
                  <info.icon className="w-8 h-8 text-orange-500 mb-3" />
                  <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">{info.title}</h3>
                  <div className="space-y-1">
                    {info.details.map((detail) => (
                      <p key={detail} className="text-sm text-gray-600">{detail}</p>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Form + Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
                Send Us a <span className="text-orange-500">Message</span>
              </h2>
              <p className="text-gray-600 mb-8">
                We&apos;ll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="+233 XXX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Subject *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="membership">Membership Inquiry</option>
                    <option value="classes">Class Information</option>
                    <option value="personal-training">Personal Training</option>
                    <option value="corporate">Corporate Wellness</option>
                    <option value="tour">Facility Tour</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                    placeholder="How can we help you?"
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
                  {formStatus === 'sent' && 'Message Sent!'}
                </Button>
              </form>
            </motion.div>

            {/* Map + Social */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Map */}
              <Card className="bg-white border-gray-200 overflow-hidden">
                <div className="aspect-[4/3]">
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

              {/* Social */}
              <Card className="bg-gray-900 p-6 border-0">
                <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
                <div className="space-y-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      className="flex items-center space-x-3 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <social.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{social.label}</span>
                    </a>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Prefer to Just Show Up?
            </h2>
            <p className="text-gray-600 mb-6">
              Walk in anytime during opening hours for a free facility tour. No appointment needed.
            </p>
            <Link href="/membership">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                View Membership Plans
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
