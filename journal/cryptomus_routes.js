/**
 * Cryptomus Payment Routes for Node.js/Express Backend
 * This file contains the backend routes for handling Cryptomus payments
 */

const crypto = require('crypto');
const axios = require('axios');

// Cryptomus configuration
const CRYPTOMUS_CONFIG = {
  baseUrl: 'https://api.cryptomus.com/v1',
  merchantId: process.env.CRYPTOMUS_MERCHANT_ID || '',
  paymentApiKey: process.env.CRYPTOMUS_PAYMENT_API_KEY || '',
  payoutApiKey: process.env.CRYPTOMUS_PAYOUT_API_KEY || '',
};

/**
 * Generate signature for Cryptomus API requests
 */
function generateSignature(data, apiKey) {
  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  return crypto.createHash('md5').update(base64Data + apiKey).digest('hex');
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(data, signature) {
  const expectedSignature = generateSignature(data, CRYPTOMUS_CONFIG.paymentApiKey);
  return signature === expectedSignature;
}

/**
 * Create Cryptomus routes for Express app
 */
function createCryptomusRoutes(app) {
  
  /**
   * Create a Cryptomus payment invoice
   */
  app.post('/api/cryptomus/create-invoice', async (req, res) => {
    try {
      const {
        amount,
        currency = 'USD',
        order_id,
        currency_to = 'USDT',
        network = 'tron',
        url_callback,
        url_success,
        url_return,
        email,
        is_payment_multiple = false,
        lifetime = 3600,
      } = req.body;

      // Prepare request data
      const requestData = {
        merchant: CRYPTOMUS_CONFIG.merchantId,
        amount: amount.toString(),
        currency,
        order_id,
        currency_to,
        network,
        url_callback,
        url_success,
        url_return,
        email,
        is_payment_multiple,
        lifetime,
      };

      // Generate signature
      const signature = generateSignature(requestData, CRYPTOMUS_CONFIG.paymentApiKey);

      // Make request to Cryptomus API
      const response = await axios.post(`${CRYPTOMUS_CONFIG.baseUrl}/payment`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_CONFIG.merchantId,
          'sign': signature,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error creating Cryptomus invoice:', error);
      res.status(500).json({
        state: 1,
        message: `Error creating invoice: ${error.message}`,
      });
    }
  });

  /**
   * Get payment information
   */
  app.post('/api/cryptomus/payment-info/:paymentUuid', async (req, res) => {
    try {
      const { paymentUuid } = req.params;

      const requestData = {
        merchant: CRYPTOMUS_CONFIG.merchantId,
        uuid: paymentUuid,
      };

      // Generate signature
      const signature = generateSignature(requestData, CRYPTOMUS_CONFIG.paymentApiKey);

      // Make request to Cryptomus API
      const response = await axios.post(`${CRYPTOMUS_CONFIG.baseUrl}/payment/info`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_CONFIG.merchantId,
          'sign': signature,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error getting payment info:', error);
      res.status(500).json({
        state: 1,
        message: `Error getting payment info: ${error.message}`,
      });
    }
  });

  /**
   * Get available payment services
   */
  app.get('/api/cryptomus/services', async (req, res) => {
    try {
      const requestData = {
        merchant: CRYPTOMUS_CONFIG.merchantId,
      };

      // Generate signature
      const signature = generateSignature(requestData, CRYPTOMUS_CONFIG.paymentApiKey);

      // Make request to Cryptomus API
      const response = await axios.post(`${CRYPTOMUS_CONFIG.baseUrl}/payment/services`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_CONFIG.merchantId,
          'sign': signature,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error getting services:', error);
      res.status(500).json({
        state: 1,
        message: `Error getting services: ${error.message}`,
      });
    }
  });

  /**
   * Handle Cryptomus payment webhooks
   */
  app.post('/api/cryptomus/webhook', async (req, res) => {
    try {
      // Get the signature from headers
      const signature = req.headers.sign;
      if (!signature) {
        return res.status(400).json({ error: 'No signature provided' });
      }

      // Get webhook data
      const webhookData = req.body;

      // Verify signature
      if (!verifyWebhookSignature(webhookData, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Process the webhook
      const {
        status: paymentStatus,
        order_id,
        uuid: paymentUuid,
        amount,
        currency,
        network,
        txid,
        payment_amount,
        payment_currency,
      } = webhookData;

      console.log('Cryptomus webhook received:');
      console.log(`Order ID: ${order_id}`);
      console.log(`Payment UUID: ${paymentUuid}`);
      console.log(`Status: ${paymentStatus}`);
      console.log(`Amount: ${amount} ${currency}`);
      console.log(`Payment Amount: ${payment_amount} ${payment_currency}`);
      console.log(`Network: ${network}`);
      console.log(`Transaction ID: ${txid}`);

      // Here you would typically:
      // 1. Update your database with the payment status
      // 2. Send email notifications
      // 3. Activate user accounts/services
      // 4. Handle any business logic

      const webhookLog = {
        timestamp: new Date().toISOString(),
        order_id,
        payment_uuid: paymentUuid,
        status: paymentStatus,
        amount,
        currency,
        payment_amount,
        payment_currency,
        network,
        txid,
        webhook_data: webhookData,
      };

      // You should save this to your database
      console.log('Webhook processed:', webhookLog);

      // Example of handling different payment statuses
      switch (paymentStatus) {
        case 'paid':
        case 'paid_over':
          console.log(`Payment completed for order ${order_id}`);
          // Activate user's subscription/service
          // Send confirmation email
          break;
        case 'cancel':
        case 'fail':
        case 'system_fail':
          console.log(`Payment failed for order ${order_id}`);
          // Handle failed payment
          // Send failure notification
          break;
        case 'refund_paid':
          console.log(`Refund completed for order ${order_id}`);
          // Handle refund
          break;
        default:
          console.log(`Payment status ${paymentStatus} for order ${order_id}`);
      }

      // Respond with success
      res.json({ status: 'success' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Test endpoint to check Cryptomus API connectivity
   */
  app.get('/api/cryptomus/test', async (req, res) => {
    try {
      // Test by getting services
      const requestData = {
        merchant: CRYPTOMUS_CONFIG.merchantId,
      };

      const signature = generateSignature(requestData, CRYPTOMUS_CONFIG.paymentApiKey);

      const response = await axios.post(`${CRYPTOMUS_CONFIG.baseUrl}/payment/services`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_CONFIG.merchantId,
          'sign': signature,
        },
      });

      res.json({
        status: 'success',
        message: 'Cryptomus API connection successful',
        services: response.data.result?.length || 0,
      });
    } catch (error) {
      console.error('Cryptomus API test failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Cryptomus API connection failed',
        error: error.message,
      });
    }
  });
}

module.exports = {
  createCryptomusRoutes,
  generateSignature,
  verifyWebhookSignature,
  CRYPTOMUS_CONFIG,
};

// Example usage:
// const express = require('express');
// const { createCryptomusRoutes } = require('./cryptomus_routes');
// 
// const app = express();
// app.use(express.json());
// 
// // Add Cryptomus routes
// createCryptomusRoutes(app);
// 
// app.listen(3000, () => {
//   console.log('Server running on port 3000');
// });
