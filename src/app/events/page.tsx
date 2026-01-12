'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, DollarSign, CheckCircle2, CalendarDays, Sparkles } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  name: string;
  description: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  isPaid: boolean;
  price: number | null;
  status: string;
  registeredCount?: number;
}

const pricingOptions = [
  { name: 'Daily', price: 'GH₵20', duration: '1 Day', features: ['Full Gym Access', 'All Classes', 'Equipment Usage'] },
  { name: 'Weekly', price: 'GH₵50', duration: '7 Days', features: ['Full Gym Access', 'All Classes', 'Equipment Usage', 'Guest Pass'] },
  { name: 'Monthly', price: 'GH₵150', duration: '30 Days', features: ['Full Gym Access', 'All Classes', 'Equipment Usage', 'Priority Booking', '1 Guest Pass'], popular: true },
  { name: '3 Months', price: 'GH₵400', duration: '90 Days', features: ['Full Gym Access', 'All Classes', 'Equipment Usage', 'Priority Booking', '2 Guest Passes', 'Nutrition Guide'] },
  { name: '6 Months', price: 'GH₵750', duration: '180 Days', features: ['Full Gym Access', 'All Classes', 'Equipment Usage', 'Priority Booking', '4 Guest Passes', 'Nutrition Guide', 'Progress Tracking'] },
  { name: 'Annual', price: 'GH₵1,400', duration: '365 Days', features: ['Full Gym Access', 'All Classes', 'Equipment Usage', 'Priority Booking', 'Unlimited Guest Passes', 'Nutrition Guide', 'Progress Tracking', 'Free Merchandise'], featured: true },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/events');
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

  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'workshop':
        return Sparkles;
      case 'competition':
        return Users;
      case 'social':
        return CalendarDays;
      default:
        return Calendar;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <PageHero
        title="Upcoming Events"
        subtitle="Join our exciting fitness events and connect with the community"
        backgroundImage="/images/hero-events.jpg"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Events Section */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join Our <span className="text-orange-500">Community Events</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From fitness challenges to wellness workshops, there&apos;s always something exciting happening at GemFitness.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No upcoming events at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => {
                const EventIcon = getEventTypeIcon(event.type);
                const spotsLeft = event.maxParticipants - (event.registeredCount || 0);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white border-2 border-gray-100 hover:border-orange-500 transition-all duration-300 h-full group cursor-pointer hover:shadow-lg">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <EventIcon className="w-8 h-8 text-white" />
                          </div>
                          {event.status === 'ACTIVE' && spotsLeft > 0 && spotsLeft <= 10 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                              {spotsLeft} spots left
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                          {event.name}
                        </h3>

                        <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
                          {event.description}
                        </p>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">{formatDate(event.date)}</span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">{event.location}</span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Users className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">
                              {event.registeredCount || 0} / {event.maxParticipants} registered
                            </span>
                          </div>

                          {event.isPaid && (
                            <div className="flex items-center space-x-3">
                              <DollarSign className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                GH₵{event.price?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={event.status !== 'ACTIVE' || spotsLeft === 0}
                          >
                            {event.status !== 'ACTIVE' 
                              ? 'Event Ended'
                              : spotsLeft === 0 
                                ? 'Fully Booked' 
                                : event.isPaid 
                                  ? 'Register Now' 
                                  : 'Join for Free'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Membership Section */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get <span className="text-orange-500">Unlimited Access</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Choose the perfect membership plan and never miss an event or class again!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingOptions.map((option, index) => (
              <motion.div
                key={option.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden h-full ${
                  option.featured 
                    ? 'border-orange-500 border-2 shadow-xl' 
                    : option.popular 
                      ? 'border-orange-300 border-2'
                      : 'border-gray-200 border'
                }`}>
                  {option.featured && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 text-sm font-semibold">
                      Best Value
                    </div>
                  )}
                  {option.popular && !option.featured && (
                    <div className="absolute top-0 right-0 bg-orange-400 text-white px-4 py-1 text-sm font-semibold">
                      Popular
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{option.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-orange-500">{option.price}</span>
                      <span className="text-gray-600 ml-2">/ {option.duration}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {option.features.map((feature) => (
                        <li key={feature} className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full ${
                        option.featured 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-white hover:bg-gray-50 text-orange-500 border-2 border-orange-500'
                      }`}
                    >
                      Get Started
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-12 text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Sign up today and get access to all events, classes, and exclusive member benefits!
          </p>
          <Button 
            size="lg"
            className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
          >
            Start Your Journey
          </Button>
        </motion.section>
      </div>

      <Footer />
    </div>
  );
}
