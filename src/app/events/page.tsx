'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, MapPin, CalendarDays, Sparkles, Users, ArrowRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { Card } from '@/components/ui/card';
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

export default function EventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Events"
        title="Upcoming Events"
        description="From fitness challenges to wellness workshops — there's always something happening at GemFitness."
      />

      {/* Events Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              What&apos;s <span className="text-orange-500">Coming Up</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6" />
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our community events and connect with fellow fitness enthusiasts.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Events</h3>
              <p className="text-gray-600 mb-6">Check back soon — we&apos;re always planning something new!</p>
              <Link href="/classes">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  Browse Classes Instead <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => {
                const EventIcon = getEventTypeIcon(event.category);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white border-gray-200 hover:border-orange-500 transition-all duration-300 h-full group">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                            <EventIcon className="w-7 h-7 text-orange-500 group-hover:text-white transition-colors" />
                          </div>
                          {event.category && (
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full capitalize">
                              {event.category.toLowerCase().replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                          {event.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                          {event.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <MapPin className="w-4 h-4 text-orange-500" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          <Link href="/signup">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
                              Register Now <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Never Miss an Event
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Members get priority access and exclusive event invitations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/membership">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6">
                  Become a Member
                </Button>
              </Link>
              <Link href="/classes">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-white/10 text-lg px-8 py-6">
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
