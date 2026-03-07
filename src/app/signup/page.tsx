'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  MapPin,
  Check,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Declare PaystackPop for TypeScript
declare global {
  interface Window {
    PaystackPop: {
      new(): {
        resumeTransaction: (accessCode: string, options: {
          onSuccess: (response: { reference: string }) => void;
          onCancel: () => void;
        }) => void;
      };
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        currency?: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

const membershipPlans = {
  monthly: {
    name: 'Monthly',
    price: 200,
    period: 'month',
    popular: false,
    savings: '',
    features: [
      'Full gym access',
      'All equipment',
      'Group classes',
      'Locker facility',
      'Shower & changing rooms',
    ],
  },
  quarterly: {
    name: 'Quarterly',
    price: 500,
    period: '3 months',
    savings: 'Save GH₵100',
    popular: true,
    features: [
      'Everything in Monthly',
      'Priority booking',
      '1 free personal training session',
      'Nutrition consultation',
      'Progress tracking',
      'Towel service',
      'Member events access',
      'Free guest passes (2/quarter)',
      'Mobile app access',
      '10% merchandise discount',
    ],
  },
  annual: {
    name: 'Annual',
    price: 2200,
    period: 'year',
    savings: 'Save GH₵200',
    popular: false,
    features: [
      'Everything in Quarterly',
      'Unlimited personal training',
      'Monthly nutrition plan & tracking',
      'Exclusive member events',
      'Bring-a-friend days',
      'Free merchandise',
      'Priority equipment access',
      'Complimentary sports massage (quarterly)',
      'VIP support',
      'Free guest passes (unlimited)',
    ],
  },
};

export default function SignupPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || 'quarterly';
  const [selectedPlan, setSelectedPlan] = useState(planParam);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    fitnessGoals: '',
    medicalConditions: '',
    agreeToTerms: false,
    // PAR-Q Basic Screening
    hasHeartCondition: false,
    hasChestPain: false,
    hasDizziness: false,
    hasJointProblems: false,
    takesMedication: false,
    hasOtherConditions: false,
    otherConditionsDetails: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const SUBMISSION_COOLDOWN = 3000; // 3 seconds between submissions
  const [error, setError] = useState('');

  // Update selected plan when URL parameter changes
  useEffect(() => {
    setSelectedPlan(planParam);
  }, [planParam]);

  const plan = membershipPlans[selectedPlan as keyof typeof membershipPlans];
  const registrationFee = 250;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent rapid submissions
    const now = Date.now();
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      setError(`Please wait ${Math.ceil((SUBMISSION_COOLDOWN - (now - lastSubmissionTime)) / 1000)} seconds before submitting again.`);
      return;
    }

    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLastSubmissionTime(now);
    setError('');

    try {
      // Validate form before payment
      if (!formData.email || !formData.firstName || !formData.lastName) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      if (!formData.agreeToTerms) {
        setError('Please agree to the terms and conditions');
        setIsSubmitting(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }

      // ✅ Check email and phone uniqueness BEFORE initiating payment
      const availabilityParams = new URLSearchParams();
      if (formData.email) availabilityParams.set('email', formData.email);
      if (formData.phone) availabilityParams.set('phone', formData.phone);

      const availabilityRes = await fetch(`/api/auth/check-availability?${availabilityParams.toString()}`);
      const availabilityData = await availabilityRes.json();

      if (!availabilityRes.ok && availabilityData.available === false) {
        setError(availabilityData.message || 'This email or phone number is already registered.');
        setIsSubmitting(false);
        return;
      }

      // ✅ SECURITY: Store password in sessionStorage (NEVER send to third-party payment providers)
      // Password will be sent to backend after OTP verification
      sessionStorage.setItem('pendingPassword', formData.password);
      sessionStorage.setItem('pendingEmail', formData.email);

      // Initialize payment with Paystack
      const paymentResponse = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          amount: registrationFee, // Free first month: only registration fee charged upfront
          metadata: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            plan: selectedPlan,
            dateOfBirth: formData.dateOfBirth,
            address: formData.address,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone,
            fitnessGoals: formData.fitnessGoals,
            medicalConditions: formData.medicalConditions,
            // ❌ Password REMOVED - never send passwords to third-party services
            registration_type: 'new_signup',
            // PAR-Q Basic Screening
            parq_basic: {
              hasHeartCondition: formData.hasHeartCondition,
              hasChestPain: formData.hasChestPain,
              hasDizziness: formData.hasDizziness,
              hasJointProblems: formData.hasJointProblems,
              takesMedication: formData.takesMedication,
              hasOtherConditions: formData.hasOtherConditions,
              otherConditionsDetails: formData.otherConditionsDetails,
              needsFollowUp: formData.hasHeartCondition || formData.hasChestPain || 
                             formData.hasDizziness || formData.hasJointProblems || 
                             formData.takesMedication || formData.hasOtherConditions,
            },
          },
          callback_url: `${window.location.origin}/payment/success`,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentData.status) {
        setError(paymentData.message || 'Payment initialization failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Open Paystack payment popup
      if (!paystackLoaded || !window.PaystackPop) {
        setError('Payment system is loading. Please try again in a moment.');
        setIsSubmitting(false);
        return;
      }

      // Redirect to Paystack checkout page using the authorization_url
      // This is the most reliable method as the transaction is already initialized
      window.location.href = paymentData.data.authorization_url;
    } catch (error) {
      console.error('Payment error:', error);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Load Paystack Inline JS */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => setPaystackLoaded(true)}
        onError={() => setError('Failed to load payment system')}
      />
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Join <span className="text-orange-500">GemFitness</span>
          </h1>
          <p className="text-xl text-gray-600">
            Start your fitness journey today with the {plan.name} plan
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Personal Information</CardTitle>
                <CardDescription>Fill in your details to create your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {/* Name Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="John"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="0XX XXX XXXX"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Min. 8 characters"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Re-enter password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date of Birth & Address */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Your address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          name="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fitness Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fitness Goals (Optional)
                    </label>
                    <textarea
                      name="fitnessGoals"
                      value={formData.fitnessGoals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Tell us about your fitness goals..."
                    />
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Conditions (Optional)
                    </label>
                    <textarea
                      name="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Any medical conditions we should know about..."
                    />
                  </div>

                  {/* PAR-Q Health Screening */}
                  <div className="border-t pt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Screening (Optional but Recommended)</h3>
                      <p className="text-sm text-gray-600">
                        This helps us provide safer, personalized training. All information is confidential.
                      </p>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasHeartCondition"
                          checked={formData.hasHeartCondition}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I have been diagnosed with a heart condition or my doctor has said I have a heart problem
                        </span>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasChestPain"
                          checked={formData.hasChestPain}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I feel pain in my chest during physical activity or at rest
                        </span>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasDizziness"
                          checked={formData.hasDizziness}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I experience dizziness, loss of balance, or lose consciousness
                        </span>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasJointProblems"
                          checked={formData.hasJointProblems}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I have bone or joint problems that could worsen with physical activity
                        </span>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="takesMedication"
                          checked={formData.takesMedication}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I am currently taking medication for blood pressure or a heart condition
                        </span>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasOtherConditions"
                          checked={formData.hasOtherConditions}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I have other medical conditions that may affect my ability to exercise safely
                        </span>
                      </label>

                      {formData.hasOtherConditions && (
                        <div className="ml-7">
                          <textarea
                            name="otherConditionsDetails"
                            value={formData.otherConditionsDetails}
                            onChange={handleInputChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                            placeholder="Please provide details..."
                          />
                        </div>
                      )}

                      {(formData.hasHeartCondition || formData.hasChestPain || formData.hasDizziness || 
                        formData.hasJointProblems || formData.takesMedication || formData.hasOtherConditions) && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Based on your responses, we recommend consulting with a healthcare provider before starting intense exercise. 
                            Our trainers will provide appropriate modifications during your orientation.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Note:</strong> After payment, you&apos;ll receive a link to complete a comprehensive health screening (PAR-Q+) 
                          before your first visit. This is for your safety and helps us design the best program for you.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div>
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <Link href="/terms" className="text-orange-500 hover:text-orange-600 underline">
                          Terms & Conditions
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-orange-500 hover:text-orange-600 underline">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg py-6 font-semibold shadow-lg"
                  >
                    {isSubmitting ? (
                      'Processing...'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Complete Registration
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              {/* Plan Selection */}
              <Card className="border-2 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Selected Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {Object.entries(membershipPlans).map(([key, p]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedPlan(key)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPlan === key
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{p.name}</h4>
                              {p.popular && (
                                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">GH₵{p.price}/{p.period}</p>
                          </div>
                          {selectedPlan === key && (
                            <Check className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>{plan.name} Membership</span>
                      <span className="font-semibold line-through text-gray-400">GH₵{plan.price}</span>
                    </div>
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>First Month</span>
                      <span className="font-semibold">FREE 🎉</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Registration Fee</span>
                      <span className="font-semibold">GH₵{registrationFee}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                      <span>Today you pay</span>
                      <span className="text-orange-500">GH₵{registrationFee}</span>
                    </div>
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                      After your free 30 days, renew at GH₵{plan.price}/{plan.period}
                    </p>
                  </div>

                  {plan.savings && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-green-700 font-semibold text-sm">
                        🎉 You&apos;re saving {plan.savings}!
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Plan Includes:</h4>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-sm text-orange-500 font-medium">
                          + {plan.features.length - 5} more benefits
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="border-2 border-gray-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Need help choosing?</p>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-50">
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}
