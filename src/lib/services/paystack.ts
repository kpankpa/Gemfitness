/**
 * Paystack Payment Utilities
 * Handles payment initialization, verification, and webhook processing
 */

import crypto from 'crypto';

interface PaystackInitializePayment {
  email: string;
  amount: number; // in kobo (GH₵ * 100)
  reference: string;
  metadata?: Record<string, string | number | boolean>;
  callback_url?: string;
  channels?: string[];
}

interface PaystackTransactionData {
  reference: string;
  status: string;
  amount: number;
  customer: {
    email: string;
    customer_code?: string;
  };
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    card_type: string;
    bank: string;
  };
  metadata?: Record<string, string | number | boolean>;
  paid_at?: string;
  created_at?: string;
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: PaystackTransactionData | PaystackTransactionData[] | { authorization_url: string; access_code: string; reference: string };
}

export class PaystackService {
  private secretKey: string;
  private publicKey: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY!;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY!;

    if (!this.secretKey || !this.publicKey) {
      throw new Error('Paystack keys are not configured');
    }
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(paymentData: PaystackInitializePayment): Promise<PaystackResponse> {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          channels: paymentData.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(reference: string): Promise<PaystackResponse> {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * List transactions
   */
  async listTransactions(params?: { 
    perPage?: number; 
    page?: number; 
    status?: 'failed' | 'success' | 'abandoned';
    from?: string;
    to?: string;
  }): Promise<PaystackResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);

      const response = await fetch(`https://api.paystack.co/transaction?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Paystack list transactions error:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Generate payment reference
   */
  generateReference(prefix: string = 'GYM'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Convert amount to kobo (Paystack uses kobo)
   */
  toKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from kobo to cedis
   */
  fromKobo(amount: number): number {
    return amount / 100;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload, 'utf8')
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string {
    return this.publicKey;
  }
}

// Singleton instance
export const paystackService = new PaystackService();