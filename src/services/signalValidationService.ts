/**
 * Signal Validation Service
 * Ensures all trading signals use validated prices from the backend
 * before being sent to the dashboard
 */

interface PriceValidationRequest {
  pair: string;
  price: number;
  tolerance?: number;
}

interface PriceValidationResponse {
  success: boolean;
  validated: boolean;
  proposed_price: number;
  latest_backend_price: number;
  price_difference: number;
  tolerance: number;
  timestamp: string;
  error?: string;
}

interface SignalData {
  pair: string;
  signal_type: 'buy' | 'sell' | 'hold';
  price: number;
  strength: number;
  timestamp: string;
  validated: boolean;
}

class SignalValidationService {
  private static instance: SignalValidationService;
  private readonly BACKEND_URL = 'http://localhost:5000';
  private readonly VALIDATION_ENDPOINT = '/api/validate/price';
  private readonly SIGNAL_ENDPOINT = '/api/signals/generate';

  static getInstance(): SignalValidationService {
    if (!SignalValidationService.instance) {
      SignalValidationService.instance = new SignalValidationService();
    }
    return SignalValidationService.instance;
  }

  /**
   * Validate a price against the latest backend data
   * @param pair - Forex pair (e.g., 'EUR/USD')
   * @param price - Proposed price to validate
   * @param tolerance - Acceptable price difference (default: 0.1%)
   * @returns Validation result
   */
  async validatePrice(pair: string, price: number, tolerance: number = 0.001): Promise<PriceValidationResponse> {
    try {
      const response = await fetch(`${this.BACKEND_URL}${this.VALIDATION_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pair,
          price,
          tolerance
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Price validation failed for ${pair}:`, error);
      return {
        success: false,
        validated: false,
        proposed_price: price,
        latest_backend_price: 0,
        price_difference: 1,
        tolerance,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a trading signal with price validation
   * @param signalData - Signal information
   * @returns Generated signal with validation status
   */
  async generateValidatedSignal(signalData: Omit<SignalData, 'validated' | 'timestamp'>): Promise<SignalData | null> {
    try {
      // First validate the price
      const validation = await this.validatePrice(signalData.pair, signalData.price);
      
      if (!validation.validated) {
        console.warn(`⚠️ Price validation failed for ${signalData.pair}:`, {
          proposed: signalData.price,
          backend: validation.latest_backend_price,
          difference: validation.price_difference
        });
        
        // Return null to indicate validation failure
        return null;
      }

      // Price is valid, generate the signal
      const response = await fetch(`${this.BACKEND_URL}${this.SIGNAL_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pair: signalData.pair,
          signal_type: signalData.signal_type,
          price: signalData.price,
          strength: signalData.strength
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Generated validated signal for ${signalData.pair}:`, result.signal);
        return {
          ...signalData,
          validated: true,
          timestamp: result.signal.timestamp
        };
      } else {
        throw new Error(result.error || 'Signal generation failed');
      }
    } catch (error) {
      console.error(`❌ Signal generation failed for ${signalData.pair}:`, error);
      return null;
    }
  }

  /**
   * Batch validate multiple prices
   * @param validations - Array of price validation requests
   * @returns Array of validation results
   */
  async validateMultiplePrices(validations: PriceValidationRequest[]): Promise<PriceValidationResponse[]> {
    const results: PriceValidationResponse[] = [];
    
    for (const validation of validations) {
      const result = await this.validatePrice(
        validation.pair, 
        validation.price, 
        validation.tolerance
      );
      results.push(result);
      
      // Add small delay to avoid overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Check if a price is within acceptable range for a pair
   * @param pair - Forex pair
   * @param price - Price to check
   * @param tolerance - Acceptable tolerance
   * @returns True if price is acceptable
   */
  async isPriceAcceptable(pair: string, price: number, tolerance: number = 0.001): Promise<boolean> {
    const validation = await this.validatePrice(pair, price, tolerance);
    return validation.validated;
  }

  /**
   * Get the latest validated price for a pair
   * @param pair - Forex pair
   * @returns Latest validated price or null
   */
  async getLatestValidatedPrice(pair: string): Promise<number | null> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/bot/data?pair=${encodeURIComponent(pair)}&limit=1`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        return data.data[0].price;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get latest price for ${pair}:`, error);
      return null;
    }
  }

  /**
   * Monitor price changes and validate signals in real-time
   * @param pair - Forex pair to monitor
   * @param callback - Callback function for price updates
   * @returns Cleanup function
   */
  startPriceMonitoring(pair: string, callback: (price: number, validated: boolean) => void): () => void {
    let isRunning = true;
    
    const monitor = async () => {
      while (isRunning) {
        try {
          const latestPrice = await this.getLatestValidatedPrice(pair);
          
          if (latestPrice !== null) {
            // Validate the latest price against itself (should always be valid)
            const validation = await this.validatePrice(pair, latestPrice, 0.0001);
            callback(latestPrice, validation.validated);
          }
        } catch (error) {
          console.error(`❌ Price monitoring error for ${pair}:`, error);
        }
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    };
    
    monitor();
    
    // Return cleanup function
    return () => {
      isRunning = false;
    };
  }
}

export default SignalValidationService;
export type { PriceValidationRequest, PriceValidationResponse, SignalData };
