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
  currency?: 'GHS' | 'NGN' | 'USD' | 'ZAR';
  mobile_money?: {
    phone: string;
    provider: 'mtn' | 'vod' | 'tgo'; // MTN, Vodafone, AirtelTigo
  };
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
      const payload: Record<string, unknown> = {
        email: paymentData.email,
        amount: paymentData.amount,
        reference: paymentData.reference,
        currency: paymentData.currency || 'GHS',
        channels: paymentData.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
      };

      // Debug logging for currency
      console.log('🔍 Paystack payload currency debug:', {
        passedCurrency: paymentData.currency,
        finalCurrency: payload.currency,
        fullPayload: payload
      });

      if (paymentData.callback_url) {
        payload.callback_url = paymentData.callback_url;
      }

      if (paymentData.metadata) {
        payload.metadata = paymentData.metadata;
      }

      // If mobile money is specified, add mobile money details
      if (paymentData.mobile_money) {
        payload.mobile_money = {
          phone: paymentData.mobile_money.phone,
          provider: paymentData.mobile_money.provider,
        };
        // Force mobile_money channel only when mobile money is specified
        payload.channels = ['mobile_money'];
      }

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Paystack API error:', data);
        throw new Error(data.message || 'Failed to initialize payment');
      }

      return data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw error;
    }
  }

  /**
   * Initialize Mobile Money payment specifically
   * This sends USSD prompt to customer's phone
   */
  async initializeMobileMoneyPayment(
    email: string,
    amount: number,
    phone: string,
    reference: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<{ provider: 'mtn' | 'vod' | 'tgo' }> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const provider = this.detectMoMoProvider(formattedPhone);
    
    if (!provider) {
      throw new Error('Unable to detect mobile money provider from phone number');
    }
    
    await this.initializePayment({
      email,
      amount: this.toKobo(amount),
      reference,
      currency: 'GHS',
      mobile_money: {
        phone: formattedPhone,
        provider,
      },
      metadata: {
        ...metadata,
        payment_type: 'mobile_money',
      },
    });
    
    return { provider };
  }

  /**
   * Initialize Cash payment (for record keeping)
   * Creates a transaction reference for manual cash payment
   */
  initializeCashPayment(
    amount: number,
    reference: string
  ): { reference: string; amount: number } {
    
    return {
      reference,
      amount,
    };
  }

  /**
   * Initialize Card payment
   * Returns payment URL for customer to complete payment
   */
  async initializeCardPayment(
    email: string,
    amount: number,
    reference: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<{ authorization_url: string; access_code: string }> {
    const response = await this.initializePayment({
      email,
      amount: this.toKobo(amount),
      reference,
      currency: 'GHS',
      channels: ['card', 'bank'],
      ...(metadata && { metadata }),
    });
    
    const data = response.data as { authorization_url: string; access_code: string; reference: string };
    return {
      authorization_url: data.authorization_url,
      access_code: data.access_code
    };
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
    // Use multiple entropy sources for maximum uniqueness
    const now = new Date();
    const randomBytes = crypto.randomBytes(8).toString('hex').toUpperCase();
    const dateString = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const nanoTime = process.hrtime.bigint().toString().slice(-8);
    
    // Format: PREFIX_YYYYMMDDHHMMSS_RANDOMHEX_NANOTIME
    const reference = `${prefix}_${dateString}_${randomBytes}_${nanoTime}`;
    
    console.log('🔍 Generated reference:', reference);
    
    return reference;
  }

  /**
   * Detect Mobile Money provider from phone number
   */
  detectMoMoProvider(phone: string): 'mtn' | 'vod' | 'tgo' | null {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // MTN prefixes: 024, 054, 055, 059
    if (/^(0|\+233)?(24|54|55|59)/.test(cleaned)) {
      return 'mtn';
    }
    
    // Vodafone prefixes: 020, 050
    if (/^(0|\+233)?(20|50)/.test(cleaned)) {
      return 'vod';
    }
    
    // AirtelTigo prefixes: 027, 057, 026, 056
    if (/^(0|\+233)?(27|57|26|56)/.test(cleaned)) {
      return 'tgo';
    }
    
    return null;
  }

  /**
   * Format phone number for Paystack (0XXXXXXXXX format)
   */
  formatPhoneNumber(phone: string): string {
    // Remove spaces and special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // If starts with +233, convert to 0
    if (cleaned.startsWith('+233')) {
      cleaned = '0' + cleaned.substring(4);
    }
    
    // If starts with 233, convert to 0
    if (cleaned.startsWith('233')) {
      cleaned = '0' + cleaned.substring(3);
    }
    
    return cleaned;
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