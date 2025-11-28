'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      // In production, validate credentials with backend
      if (formData.username && formData.password) {
        // Store session
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminUser', formData.username);
        router.push('/admin/dashboard');
      } else {
        alert('Please enter valid credentials');
        setIsLoading(false);
      }
    }, 1000);
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
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Enter username"
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
            <div className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-800 font-medium text-center">
                Demo Access: Use any username/password
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Website */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-orange-500 transition-colors font-medium"
          >
            ← Back to Website
          </a>
        </div>
      </motion.div>
    </div>
  );
}
