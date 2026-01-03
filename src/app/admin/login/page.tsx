'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📡 Login response status:', response.status);

      const data = await response.json();
      console.log('📊 Login data:', data);

      if (response.ok && data.success) {
        console.log('✅ Login successful, redirecting...');
        // Check if user has admin/receptionist/manager role
        if (data.redirectUrl?.includes('/admin') || data.redirectUrl?.includes('/dashboard')) {
          // Give the cookie a moment to be set before redirecting
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Force a hard navigation to ensure cookies are sent
          window.location.href = data.redirectUrl;
        } else {
          setError('Access denied. Admin, Manager, or Receptionist role required.');
          setIsLoading(false);
        }
      } else {
        console.log('❌ Login failed:', data.error);
        setError(data.error || 'Invalid credentials');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF6B00_1px,transparent_1px),linear-gradient(to_bottom,#FF6B00_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <Image
              src="/logo.png"
              alt="GemFitness Logo"
              width={60}
              height={60}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <Card className="border-2 border-gray-100 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Access</CardTitle>
            <CardDescription className="text-base">
              Receptionist & Administrative Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="admin@gemfitness.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base group"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
              <p className="text-xs font-bold text-orange-900 mb-2">Demo Access:</p>
              <div className="space-y-1">
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">Manager:</span> Use &quot;manager&quot; or &quot;admin&quot; as username
                </p>
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">Receptionist:</span> Use any other username
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Website */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-orange-500 transition-colors font-medium"
          >
            ← Back to Website
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
