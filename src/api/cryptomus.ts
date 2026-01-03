import crypto from 'crypto';

// Cryptomus configuration
const CRYPTOMUS_CONFIG = {
  baseUrl: 'https://api.cryptomus.com/v1',
  merchantId: process.env.CRYPTOMUS_MERCHANT_ID || '',
  paymentApiKey: process.env.CRYPTOMUS_PAYMENT_API_KEY || '',
  payoutApiKey: process.env.CRYPTOMUS_PAYOUT_API_KEY || '',
};

// Generate signature for Cryptomus API requests
function generateSignature(data: any, apiKey: string): string {
  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  return crypto.createHash('md5').update(base64Data + apiKey).digest('hex');
}

// Create invoice for payment
export interface CreateInvoiceRequest {
  amount: string;
  currency: string;
  order_id: string;
  currency_to?: string;
  network?: string;
  url_callback?: string;
  url_success?: string;
  url_return?: string;
  email?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  to_currency_discount?: string;
}

export interface CreateInvoiceResponse {
  state: number;
  result?: {
    uuid: string;
    order_id: string;
    amount: string;
    currency: string;
    url: string;
    address: string;
    payment_status: string;
    created_at: string;
    expired_at: string;
    network: string;
    currency_to: string;
    amount_to: string;
  };
  message?: string;
}

export async function createInvoice(data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  try {
    const requestData = {
      merchant: CRYPTOMUS_CONFIG.merchantId,
      ...data,
    };

    const signature = generateSignature(requestData, CRYPTOMUS_CONFIG.paymentApiKey);

    const response = await fetch(`${CRYPTOMUS_CONFIG.baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': CRYPTOMUS_CONFIG.merchantId,
        'sign': signature,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating Cryptomus invoice:', error);
    throw error;
  }
}

// Get payment information
export interface PaymentInfoRequest {
  uuid: string;
  order_id?: string;
}

export interface PaymentInfoResponse {
  state: number;
  result?: {
    uuid: string;
    order_id: string;
    amount: string;
    currency: string;
    payment_status: string;
    payment_amount?: string;
    payment_currency?: string;
    created_at: string;
    updated_at: string;
    network: string;
    address: string;
    txid?: string;
    additional_data?: any;
  };
  message?: string;
}

export async function getPaymentInfo(data: PaymentInfoRequest): Promise<PaymentInfoResponse> {
  try {
    const requestData = {
      merchant: CRYPTOMUS_CONFIG.merchantId,
      ...data,
    };

    const signature = generateSignature(requestData, CRYPTOMUS_CONFIG.paymentApiKey);

    const response = await fetch(`${CRYPTOMUS_CONFIG.baseUrl}/payment/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': CRYPTOMUS_CONFIG.merchantId,
        'sign': signature,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting payment info:', error);
    throw error;
  }
}

// Verify webhook signature
export function verifyWebhookSignature(data: any, signature: string): boolean {
  try {
    const expectedSignature = generateSignature(data, CRYPTOMUS_CONFIG.paymentApiKey);
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Get list of available services/currencies
export interface ServicesResponse {
  state: number;
  result?: Array<{
    network: string;
    currency: string;
    is_available: boolean;
    limit_min: string;
    limit_max: string;
    commission_percent: string;
  }>;
  message?: string;
}

export async function getServices(): Promise<ServicesResponse> {
  try {
    const requestData = {
      merchant: CRYPTOMUS_CONFIG.merchantId,
    };

    const signature = generateSignature(requestData, CRYPTOMUS_CONFIG.paymentApiKey);

    const response = await fetch(`${CRYPTOMUS_CONFIG.baseUrl}/payment/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': CRYPTOMUS_CONFIG.merchantId,
        'sign': signature,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
}

// Payment statuses
export const PAYMENT_STATUSES = {
  WAIT_PAYMENT: 'wait_payment',
  PAID: 'paid',
  PAID_OVER: 'paid_over',
  FAIL: 'fail',
  CANCEL: 'cancel',
  SYSTEM_FAIL: 'system_fail',
  REFUND_PROCESS: 'refund_process',
  REFUND_FAIL: 'refund_fail',
  REFUND_PAID: 'refund_paid',
  WRONG_AMOUNT: 'wrong_amount',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];
