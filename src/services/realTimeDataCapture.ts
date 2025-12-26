/**
 * Real-Time Data Capture Service
 * Automatically captures data from payment, questionnaire, and dashboard interactions
 */

class RealTimeDataCapture {
  private static instance: RealTimeDataCapture;
  private baseURL: string;
  private enabled: boolean = true;

  private constructor() {
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5005/api'
      : 'https://traderedgepro.com/api';
  }

  public static getInstance(): RealTimeDataCapture {
    if (!RealTimeDataCapture.instance) {
      RealTimeDataCapture.instance = new RealTimeDataCapture();
    }
    return RealTimeDataCapture.instance;
  }

  // Capture payment data
  async capturePayment(paymentData: any): Promise<void> {
    if (!this.enabled) return;

    try {
      const user = this.getCurrentUser();
      const captureData = {
        ...paymentData,
        user_email: user?.email || paymentData.user_email || paymentData.email,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.baseURL}/payment/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData)
      });

      if (response.ok) {
        console.log('✅ Payment data captured in real-time');
      } else {
        console.warn('⚠️ Payment capture failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Payment capture error:', error);
    }
  }

  // Capture questionnaire data
  async captureQuestionnaire(questionnaireData: any): Promise<void> {
    if (!this.enabled) return;

    try {
      const user = this.getCurrentUser();
      const captureData = {
        ...questionnaireData,
        user_email: user?.email || questionnaireData.user_email || questionnaireData.email,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.baseURL}/questionnaire/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData)
      });

      if (response.ok) {
        console.log('✅ Questionnaire data captured in real-time');
      } else {
        console.warn('⚠️ Questionnaire capture failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Questionnaire capture error:', error);
    }
  }

  // Capture dashboard data
  async captureDashboard(dashboardData: any): Promise<void> {
    if (!this.enabled) return;

    try {
      const user = this.getCurrentUser();
      const captureData = {
        ...dashboardData,
        user_email: user?.email || dashboardData.user_email || dashboardData.email,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.baseURL}/dashboard/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData)
      });

      if (response.ok) {
        console.log('✅ Dashboard data captured in real-time');
      } else {
        console.warn('⚠️ Dashboard capture failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Dashboard capture error:', error);
    }
  }

  // Get current user from various sources
  private getCurrentUser(): any {
    try {
      // Try localStorage
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }

      // Try sessionStorage
      const sessionUser = sessionStorage.getItem('currentUser');
      if (sessionUser) {
        return JSON.parse(sessionUser);
      }

      // Try global user object
      if ((window as any).currentUser) {
        return (window as any).currentUser;
      }

      return null;
    } catch (error) {
      console.warn('Could not get current user:', error);
      return null;
    }
  }

  // Enable/disable data capture
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Real-time data capture ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/live-capture/health`);
      return response.ok;
    } catch (error) {
      console.error('Real-time capture service health check failed:', error);
      return false;
    }
  }
}

// Create global instance
const realTimeDataCapture = RealTimeDataCapture.getInstance();

// Auto-hook into common payment functions
(function() {
  // Hook into fetch API to intercept API calls
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const response = await originalFetch(input, init);
    
    // Check if this is a payment, questionnaire, or dashboard API call
    const url = input.toString();
    const method = init?.method || 'GET';
    
    if (method === 'POST' && response.ok) {
      try {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        const responseData = await clonedResponse.json();
        const requestData = init?.body ? JSON.parse(init.body as string) : {};
        
        // Capture based on URL patterns
        if (url.includes('payment') && (url.includes('verify') || url.includes('complete'))) {
          realTimeDataCapture.capturePayment({
            ...requestData,
            ...responseData,
            endpoint: url
          });
        } else if (url.includes('questionnaire') && method === 'POST') {
          realTimeDataCapture.captureQuestionnaire({
            ...requestData,
            ...responseData,
            endpoint: url
          });
        } else if (url.includes('dashboard') && method === 'POST') {
          realTimeDataCapture.captureDashboard({
            ...requestData,
            ...responseData,
            endpoint: url
          });
        }
      } catch (error) {
        // Ignore errors in data capture - don't break the main flow
        console.debug('Data capture hook error:', error);
      }
    }
    
    return response;
  };
})();

// Hook into localStorage changes
(function() {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    
    // Capture relevant data changes
    try {
      if (key.includes('payment') || key.includes('transaction')) {
        const data = JSON.parse(value);
        realTimeDataCapture.capturePayment(data);
      } else if (key.includes('questionnaire')) {
        const data = JSON.parse(value);
        realTimeDataCapture.captureQuestionnaire(data);
      } else if (key.includes('dashboard') || key.includes('trading_state')) {
        const data = JSON.parse(value);
        realTimeDataCapture.captureDashboard(data);
      }
    } catch (error) {
      // Ignore parsing errors
    }
  };
})();

// Export for manual use
export default realTimeDataCapture;
