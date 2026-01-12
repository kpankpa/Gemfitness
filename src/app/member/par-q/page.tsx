'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const parqQuestions = {
  general: [
    {
      id: 'heartCondition',
      question: 'Has your doctor ever said that you have a heart condition and that you should only perform physical activity recommended by a doctor?',
      category: 'cardiac',
    },
    {
      id: 'chestPain',
      question: 'Do you feel pain in your chest when you perform physical activity?',
      category: 'cardiac',
    },
    {
      id: 'chestPainRest',
      question: 'In the past month, have you had chest pain when you were not performing any physical activity?',
      category: 'cardiac',
    },
    {
      id: 'lossOfBalance',
      question: 'Do you lose your balance because of dizziness or do you ever lose consciousness?',
      category: 'neurological',
    },
    {
      id: 'boneJoint',
      question: 'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
      category: 'musculoskeletal',
    },
    {
      id: 'medication',
      question: 'Is your doctor currently prescribing medication for your blood pressure or heart condition?',
      category: 'medication',
    },
    {
      id: 'otherReason',
      question: 'Do you know of any other reason why you should not engage in physical activity?',
      category: 'other',
    },
  ],
};

interface ParqResponses {
  [key: string]: boolean | string;
}

export default function ParQPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<ParqResponses>({});
  const [otherReasonDetails, setOtherReasonDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          // Redirect to login if not authenticated
          router.push('/login?redirect=/member/par-q');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleResponseChange = (questionId: string, value: boolean) => {
    setResponses({
      ...responses,
      [questionId]: value,
    });
    setError('');
  };

  const hasAnyYesResponse = () => {
    return Object.values(responses).some(value => value === true);
  };

  const calculateRiskLevel = (): 'low' | 'medium' | 'high' => {
    const yesCount = Object.values(responses).filter(v => v === true).length;
    
    if (yesCount === 0) return 'low';
    if (yesCount <= 2) return 'medium';
    return 'high';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const allQuestionsAnswered = parqQuestions.general.every(
        q => responses[q.id] === true || responses[q.id] === false
      );

      if (!allQuestionsAnswered) {
        setError('Please answer all questions');
        setIsSubmitting(false);
        return;
      }

      if (responses.otherReason && !otherReasonDetails) {
        setError('Please provide details for "other reason"');
        setIsSubmitting(false);
        return;
      }

      const riskLevel = calculateRiskLevel();

      const response = await fetch('/api/member/par-q', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          otherReasonDetails,
          riskLevel,
          completedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit PAR-Q');
        setIsSubmitting(false);
        return;
      }

      // Redirect to dashboard with success message
      router.push('/dashboard/member?parq=completed');
    } catch (err) {
      console.error('PAR-Q submission error:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getRiskLevelInfo = () => {
    const level = calculateRiskLevel();
    
    switch (level) {
      case 'low':
        return {
          color: 'green',
          icon: CheckCircle,
          title: 'Low Risk',
          message: 'You are cleared for physical activity. Welcome to GemFitness!',
          action: 'Start your fitness journey immediately',
        };
      case 'medium':
        return {
          color: 'yellow',
          icon: AlertTriangle,
          title: 'Medium Risk',
          message: 'We recommend starting with supervised training sessions.',
          action: 'Our trainers will provide personalized guidance',
        };
      case 'high':
        return {
          color: 'red',
          icon: AlertTriangle,
          title: 'Higher Risk Detected',
          message: 'We recommend consulting with your healthcare provider before starting intense exercise.',
          action: 'Please obtain medical clearance and share with our staff',
        };
    }
  };

  const riskInfo = hasAnyYesResponse() ? getRiskLevelInfo() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Physical Activity Readiness Questionnaire (PAR-Q+)
          </h1>
          <p className="text-lg text-gray-600">
            Help us ensure your safety and create the best training program for you
          </p>
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Why We Need This</h3>
                  <p className="text-sm text-blue-800">
                    This industry-standard screening helps identify any health concerns that might require 
                    medical clearance or special considerations in your training program. Your responses are 
                    confidential and help us keep you safe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PAR-Q Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Health Screening Questions</CardTitle>
              <CardDescription>
                Please answer all questions honestly. Select &quot;Yes&quot; or &quot;No&quot; for each question.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-6">
                  {parqQuestions.general.map((q, index) => (
                    <div key={q.id} className="border-b pb-6 last:border-b-0">
                      <p className="font-medium text-gray-900 mb-3">
                        {index + 1}. {q.question}
                      </p>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={q.id}
                            checked={responses[q.id] === true}
                            onChange={() => handleResponseChange(q.id, true)}
                            className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={q.id}
                            checked={responses[q.id] === false}
                            onChange={() => handleResponseChange(q.id, false)}
                            className="w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">No</span>
                        </label>
                      </div>

                      {/* Other Reason Details */}
                      {q.id === 'otherReason' && responses[q.id] === true && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Please provide details:
                          </label>
                          <textarea
                            value={otherReasonDetails}
                            onChange={(e) => setOtherReasonDetails(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Describe any other health concerns..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Risk Assessment Preview */}
                {hasAnyYesResponse() && riskInfo && (
                  <div className={`p-4 rounded-lg border-2 bg-${riskInfo.color}-50 border-${riskInfo.color}-200`}>
                    <div className="flex items-start gap-3">
                      <riskInfo.icon className={`w-6 h-6 text-${riskInfo.color}-600 flex-shrink-0 mt-0.5`} />
                      <div>
                        <h3 className={`font-semibold text-${riskInfo.color}-900 mb-1`}>{riskInfo.title}</h3>
                        <p className={`text-sm text-${riskInfo.color}-800 mb-2`}>{riskInfo.message}</p>
                        <p className={`text-sm text-${riskInfo.color}-700`}>
                          <strong>Next Steps:</strong> {riskInfo.action}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Declaration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Declaration:</strong> I have read, understood and completed this questionnaire to the best 
                    of my knowledge. I acknowledge that my responses are accurate and I will inform GemFitness staff 
                    of any changes to my health status.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg py-6 font-semibold shadow-lg"
                  >
                    {isSubmitting ? (
                      'Submitting...'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Submit PAR-Q
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push('/dashboard/member')}
                    variant="outline"
                    className="px-6"
                  >
                    <Home className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/contact" className="text-orange-500 hover:text-orange-600 font-semibold">
              Contact our support team
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
