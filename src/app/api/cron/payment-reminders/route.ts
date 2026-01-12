// Automated Payment Reminders Cron Job
// src/app/api/cron/payment-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPaymentReminders } from '@/lib/services/payment/reminder-system';
import logger from '@/lib/logger';

/**
 * Cron Job: Payment Reminders
 * Schedule: Run daily at 9:00 AM
 * Purpose: Send payment expiry reminders and process failed payments
 * 
 * URL: /api/cron/payment-reminders
 * Method: GET (for Vercel cron) or POST
 */
export async function GET(request: NextRequest) {
  return handlePaymentReminders(request);
}

export async function POST(request: NextRequest) {
  return handlePaymentReminders(request);
}

async function handlePaymentReminders(request: NextRequest) {
  try {
    // Verify cron job authorization (basic security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('🚫 Unauthorized cron request for payment reminders');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('⏰ Starting scheduled payment reminders...');
    const startTime = Date.now();

    // Process payment reminders
    const result = await processScheduledPaymentReminders();

    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('✅ Payment reminders completed successfully', {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        duration,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('❌ Payment reminders failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        duration,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('❌ Payment reminders cron error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}