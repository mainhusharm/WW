import { getCheckoutPrice, getPricingTier } from '../services/pricingService';

interface PaymentRequest {
  tierId: string;
  userId: string;
  email: string;
  paymentMethod: 'stripe' | 'paypal';
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  amount: number;
  currency: string;
  error?: string;
}

class PaymentService {
  // Process payment with automatic coupon application
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const tier = getPricingTier(request.tierId);
      
      if (!tier) {
        return {
          success: false,
          amount: 0,
          currency: 'USD',
          error: 'Invalid pricing tier'
        };
      }

      // Get final price (includes private coupon discount automatically)
      const finalAmount = getCheckoutPrice(request.tierId);
      
      // Simulate payment processing
      const transactionId = this.generateTransactionId();
      
      // Log payment for audit (but don't expose coupon details)
      console.log(`Payment processed: User ${request.userId}, Tier ${request.tierId}, Amount $${finalAmount}`);
      
      return {
        success: true,
        transactionId,
        amount: finalAmount,
        currency: tier.currency
      };
      
    } catch (error) {
      return {
        success: false,
        amount: 0,
        currency: 'USD',
        error: 'Payment processing failed'
      };
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate payment amount (ensures no tampering)
  validatePaymentAmount(tierId: string, providedAmount: number): boolean {
    const expectedAmount = getCheckoutPrice(tierId);
    return Math.abs(providedAmount - expectedAmount) < 0.01; // Allow for floating point precision
  }
}

const paymentService = new PaymentService();

export const processPayment = (request: PaymentRequest) => paymentService.processPayment(request);
export const validatePaymentAmount = (tierId: string, amount: number) => 
  paymentService.validatePaymentAmount(tierId, amount);

export default paymentService;
