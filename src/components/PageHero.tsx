'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  children?: ReactNode;
}

export default function PageHero({
  title,
  subtitle,
  description,
  backgroundImage,
  children,
}: PageHeroProps) {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Background */}
      <div className="absolute inset-0">
        {backgroundImage && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
      </div>

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,107,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <span className="text-orange-600 font-bold tracking-wide uppercase text-sm bg-orange-100 px-4 py-2 rounded-full inline-block">
              {subtitle}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
