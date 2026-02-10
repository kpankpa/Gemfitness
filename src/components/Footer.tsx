"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 flex-shrink-0">
                <Image
                  src="/gemfitness.svg"
                  alt="GemFitness Logo"
                  width={64}
                  height={64}
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Transform your body, elevate your mind. We&apos;re What We Eat! Join Tema Gbestile&apos;s premier fitness destination.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/classes" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Classes
                </Link>
              </li>
              <li>
                <Link href="/trainers" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Trainers
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Membership
                </Link>
              </li>
              <li>
                <Link href="/success" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-orange-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Tema, Gbestile, Ghana</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span>+233 (0) 123 456 789</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span>info@gemfitness.com</span>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Hours:</strong><br />
                Mon-Fri: 5:00 AM - 10:00 PM<br />
                Sat-Sun: 7:00 AM - 8:00 PM
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} GemFitness. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
