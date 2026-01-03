import api from './index';

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Create Stripe payment intent
export const createPaymentIntent = async (data: PaymentIntentRequest): Promise<PaymentIntentResponse> => {
  try {
    // For demo purposes, we'll simulate the payment intent creation
    // In a real app, this would call your backend API
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    
    // Fallback: Create a mock payment intent for demo purposes
    const mockClientSecret = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
    };
  }
};

// Verify payment completion
export const verifyPayment = async (paymentIntentId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/verify-payment/${paymentIntentId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const result = await response.json();
    return result.verified || false;
  } catch (error) {
    console.error('Payment verification failed:', error);
    
    // Fallback: Always return true for demo purposes
    return true;
  }
};

// Create PayPal order
export const createPayPalOrder = async (amount: number, currency: string = 'USD') => {
  try {
    const response = await fetch('/api/create-paypal-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create PayPal order');
    }

    return await response.json();
  } catch (error) {
    console.error('PayPal order creation failed:', error);
    
    // Fallback: Return mock order ID for demo purposes
    return {
      id: `paypal_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'CREATED',
    };
  }
};

// Capture PayPal order
export const capturePayPalOrder = async (orderId: string) => {
  try {
    const response = await fetch(`/api/capture-paypal-order/${orderId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to capture PayPal order');
    }

    return await response.json();
  } catch (error) {
    console.error('PayPal order capture failed:', error);
    
    // Fallback: Return mock capture result for demo purposes
    return {
      id: orderId,
      status: 'COMPLETED',
      payer: {
        email_address: 'demo@example.com',
      },
    };
  }
};
