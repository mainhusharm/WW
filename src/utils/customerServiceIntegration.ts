// Customer Service Integration Utility
// This utility ensures all user actions are tracked in the customer service database

import api from '../lib/api';

export class CustomerServiceIntegration {
  /**
   * Register user and save to customer service database
   */
  static async registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    plan_type: string;
  }) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data) {
        console.log('✅ User registered and saved to customer service database');
        return response.data;
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  /**
   * Verify payment and update customer service database
   */
  static async verifyPayment(paymentData: {
    email: string;
    status: string;
    payment_method?: string;
    amount?: number;
  }) {
    try {
      const response = await api.post('/payment/verify', paymentData);
      
      if (response.status === 200) {
        console.log('✅ Payment verified in customer service database');
        return true;
      }
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      return false;
    }
  }

  /**
   * Save questionnaire data to customer service database
   */
  static async saveQuestionnaire(questionnaireData: {
    email: string;
    account_type: string;
    prop_firm: string;
    account_size: number;
    questionnaire_data: any;
  }) {
    try {
      const response = await api.post('/questionnaire', questionnaireData);
      
      if (response.status === 200) {
        console.log('✅ Questionnaire saved to customer service database');
        return true;
      }
    } catch (error) {
      console.error('❌ Questionnaire save failed:', error);
      return false;
    }
  }

  /**
   * Get all customers for customer service dashboard
   */
  static async getCustomers() {
    try {
      const response = await api.get('/customers');
      
      if (response.data && response.data.success) {
        return response.data.customers;
      }
    } catch (error) {
      console.error('❌ Failed to fetch customers:', error);
      return [];
    }
  }
}

export default CustomerServiceIntegration;
        