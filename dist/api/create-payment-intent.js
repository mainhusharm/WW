// Mock API endpoint for creating Stripe payment intents
// This would normally be a backend API endpoint

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/create-payment-intent')) {
    event.respondWith(handlePaymentIntentRequest(event.request));
  }
});

async function handlePaymentIntentRequest(request) {
  try {
    const body = await request.json();
    const { amount, currency } = body;
    
    // Mock payment intent creation
    const mockClientSecret = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = {
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
      amount: amount,
      currency: currency || 'usd',
      status: 'requires_payment_method'
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
