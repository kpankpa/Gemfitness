'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function AdminLogin() {
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.redirectUrl?.includes('/admin') || data.redirectUrl?.includes('/dashboard')) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          window.location.href = data.redirectUrl;
        } else {
          setError('Access denied. Staff access is required.');
          setIsLoading(false);
        }
      } else {
        setError(data.error || 'Invalid credentials');
        setIsLoading(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/gemfitness.svg"
              alt="GemFitness"
              width={72}
              height={72}
              className="h-16 w-16 object-contain"
              priority
            />
          </Link>
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">Staff login</h1>
        <p className="mb-8 text-center text-sm text-gray-500">Sign in to the admin portal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-center text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500"
              placeholder="Email address"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500"
              placeholder="Password"
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-md bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-orange-500">
            Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
