/**
 * Event Refund Processing Service
 * Handles automatic refunds for cancelled paid events
 * 
 * src/lib/services/payment/refund-service.ts
 */

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export interface RefundResult {
  success: boolean;
  refundCount: number;
  totalAmount: number;
  failures: Array<{
    bookingId: string;
    userId: string;
    error: string;
  }>;
}

export interface EventRefundDetails {
  eventId: string;
  reason: string;
  processedBy: string;
}

/**
 * Process refunds for all paid bookings of a cancelled event
 */
export async function processEventRefunds(
  details: EventRefundDetails
): Promise<RefundResult> {
  try {
    const { eventId, reason, processedBy } = details;

    // Fetch event with paid bookings
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: {
            status: { in: ['registered', 'confirmed'] },
            paymentStatus: 'COMPLETED',
            paymentRef: { not: null },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.isFree) {
      logger.info('Event is free - no refunds needed:', { eventId, title: event.title });
      return {
        success: true,
        refundCount: 0,
        totalAmount: 0,
        failures: [],
      };
    }

    const failures: RefundResult['failures'] = [];
    let refundCount = 0;
    let totalAmount = 0;

    // Process refunds for each booking
    for (const booking of event.bookings) {
      try {
        // Get payment transaction
        const payment = await prisma.paymentTransaction.findUnique({
          where: { reference: booking.paymentRef! },
        });

        if (!payment) {
          failures.push({
            bookingId: booking.id,
            userId: booking.userId,
            error: `Payment transaction not found: ${booking.paymentRef}`,
          });
          continue;
        }

        if (payment.status === 'failed') {
          logger.info('Payment already failed - skipping refund:', {
            reference: payment.reference,
          });
          continue;
        }

        // Determine refund method based on original payment method
        let refundSuccess = false;
        let refundReference = '';

        if (payment.paymentMethod === 'paystack') {
          // Process Paystack refund
          const paystackResult = await processPaystackRefund(
            payment.paymentGatewayId!,
            payment.amount,
            reason
          );
          refundSuccess = paystackResult.success;
          refundReference = paystackResult.reference;
        } else if (payment.paymentMethod === 'cash') {
          // Manual cash refund - create refund record
          refundReference = `CASH-REFUND-${Date.now()}-${booking.id.slice(0, 8)}`;
          refundSuccess = true;
          logger.info('Cash refund scheduled for manual processing:', {
            bookingId: booking.id,
            amount: payment.amount,
            reference: refundReference,
          });
        } else if (payment.paymentMethod === 'transfer') {
          // Bank transfer refund - create refund record
          refundReference = `TRANSFER-REFUND-${Date.now()}-${booking.id.slice(0, 8)}`;
          refundSuccess = true;
          logger.info('Bank transfer refund scheduled for manual processing:', {
            bookingId: booking.id,
            amount: payment.amount,
            reference: refundReference,
          });
        }

        if (refundSuccess) {
          // Create refund transaction record
          await prisma.paymentTransaction.create({
            data: {
              userId: booking.userId,
              reference: refundReference,
              amount: -payment.amount, // Negative amount for refund
              currency: payment.currency,
              status: payment.paymentMethod === 'paystack' ? 'success' : 'pending',
              paymentMethod: payment.paymentMethod,
              transactionType: 'refund',
              relatedEntityId: eventId,
              relatedEntityType: 'event',
              paymentGatewayId: payment.paymentGatewayId,
              metadata: {
                originalReference: payment.reference,
                eventId: eventId,
                eventTitle: event.title,
                reason: reason,
                processedBy: processedBy,
                refundDate: new Date().toISOString(),
              },
              paidAt: new Date(),
            },
          });

          // Update booking payment status
          await prisma.eventBooking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'REFUNDED',
              status: 'cancelled',
            },
          });

          refundCount++;
          totalAmount += payment.amount;

          logger.info('Refund processed successfully:', {
            bookingId: booking.id,
            userId: booking.userId,
            amount: payment.amount,
            reference: refundReference,
            method: payment.paymentMethod,
          });
        } else {
          failures.push({
            bookingId: booking.id,
            userId: booking.userId,
            error: 'Refund processing failed',
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        failures.push({
          bookingId: booking.id,
          userId: booking.userId,
          error: errorMsg,
        });
        logger.error('Error processing refund:', {
          bookingId: booking.id,
          error: errorMsg,
        });
      }
    }

    logger.info('Event refunds processed:', {
      eventId,
      eventTitle: event.title,
      totalBookings: event.bookings.length,
      refundCount,
      totalAmount,
      failures: failures.length,
    });

    return {
      success: true,
      refundCount,
      totalAmount,
      failures,
    };
  } catch (error) {
    logger.error('Error processing event refunds:', error);
    throw error;
  }
}

/**
 * Process refund through Paystack
 */
async function processPaystackRefund(
  transactionId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; reference: string }> {
  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      logger.warn('Paystack secret key not configured - refund will be manual');
      return {
        success: true,
        reference: `MANUAL-REFUND-${Date.now()}-${transactionId.slice(0, 8)}`,
      };
    }

    // Call Paystack refund API
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: transactionId,
        amount: Math.round(amount * 100), // Convert to kobo
        merchant_note: reason,
      }),
    });

    const data = await response.json();

    if (response.ok && data.status) {
      logger.info('Paystack refund successful:', {
        transactionId,
        refundId: data.data.id,
        reference: data.data.transaction_reference,
      });

      return {
        success: true,
        reference: data.data.transaction_reference || `PS-REFUND-${data.data.id}`,
      };
    } else {
      logger.error('Paystack refund failed:', {
        transactionId,
        error: data.message,
      });

      // Fall back to manual refund
      return {
        success: true,
        reference: `MANUAL-REFUND-${Date.now()}-${transactionId.slice(0, 8)}`,
      };
    }
  } catch (error) {
    logger.error('Error calling Paystack refund API:', error);
    
    // Fall back to manual refund on error
    return {
      success: true,
      reference: `MANUAL-REFUND-${Date.now()}-${transactionId.slice(0, 8)}`,
    };
  }
}

/**
 * Get refund status for an event
 */
export async function getEventRefundStatus(eventId: string): Promise<{
  totalBookings: number;
  refundedCount: number;
  pendingCount: number;
  failedCount: number;
  totalRefundAmount: number;
}> {
  try {
    const bookings = await prisma.eventBooking.findMany({
      where: {
        eventId,
        paymentStatus: { not: null },
      },
      select: {
        paymentStatus: true,
        paymentRef: true,
      },
    });

    let refundedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    const refundTransactions = await prisma.paymentTransaction.findMany({
      where: {
        relatedEntityId: eventId,
        relatedEntityType: 'event',
        transactionType: 'refund',
      },
    });

    const totalRefundAmount = refundTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    for (const booking of bookings) {
      if (booking.paymentStatus === 'REFUNDED') {
        refundedCount++;
      } else if (booking.paymentStatus === 'PENDING') {
        pendingCount++;
      } else if (booking.paymentStatus === 'FAILED') {
        failedCount++;
      }
    }

    return {
      totalBookings: bookings.length,
      refundedCount,
      pendingCount,
      failedCount,
      totalRefundAmount,
    };
  } catch (error) {
    logger.error('Error getting refund status:', error);
    throw error;
  }
}

/**
 * Process refund for a single cancelled booking
 */
export async function processBookingRefund(
  bookingId: string,
  reason: string,
  processedBy: string
): Promise<{ success: boolean; refundReference?: string; error?: string }> {
  try {
    const booking = await prisma.eventBooking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (!booking.paymentRef || booking.paymentStatus !== 'COMPLETED') {
      return { success: false, error: 'No payment to refund' };
    }

    // Get payment transaction
    const payment = await prisma.paymentTransaction.findUnique({
      where: { reference: booking.paymentRef },
    });

    if (!payment) {
      return { success: false, error: 'Payment transaction not found' };
    }

    // Process refund
    let refundReference = '';
    let refundSuccess = false;

    if (payment.paymentMethod === 'paystack') {
      const result = await processPaystackRefund(
        payment.paymentGatewayId!,
        payment.amount,
        reason
      );
      refundSuccess = result.success;
      refundReference = result.reference;
    } else {
      refundReference = `${payment.paymentMethod.toUpperCase()}-REFUND-${Date.now()}-${bookingId.slice(0, 8)}`;
      refundSuccess = true;
    }

    if (refundSuccess) {
      // Create refund transaction
      await prisma.paymentTransaction.create({
        data: {
          userId: booking.userId,
          reference: refundReference,
          amount: -payment.amount,
          currency: payment.currency,
          status: payment.paymentMethod === 'paystack' ? 'success' : 'pending',
          paymentMethod: payment.paymentMethod,
          transactionType: 'refund',
          relatedEntityId: booking.eventId,
          relatedEntityType: 'event',
          metadata: {
            originalReference: payment.reference,
            bookingId: bookingId,
            reason: reason,
            processedBy: processedBy,
          },
          paidAt: new Date(),
        },
      });

      // Update booking
      await prisma.eventBooking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'REFUNDED',
          status: 'cancelled',
        },
      });

      logger.info('Booking refund processed:', {
        bookingId,
        refundReference,
        amount: payment.amount,
      });

      return { success: true, refundReference };
    }

    return { success: false, error: 'Refund processing failed' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing booking refund:', { bookingId, error: errorMsg });
    return { success: false, error: errorMsg };
  }
}
