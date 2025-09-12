// Test script to verify Stripe and PayPal backend endpoints
import https from 'https';

const BACKEND_URL = 'https://backend-gbhz.onrender.com';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Test Stripe payment intent creation
async function testStripePaymentIntent() {
    console.log('🧪 Testing Stripe Payment Intent Creation...');
    
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/stripe/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: 100, // $1.00 in cents
                currency: 'usd',
                metadata: {
                    test: 'true',
                    source: 'backend_test'
                }
            })
        });
        
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 && response.data.clientSecret) {
            console.log('✅ Stripe Payment Intent created successfully!');
            console.log(`Client Secret: ${response.data.clientSecret}`);
            return true;
        } else {
            console.log('❌ Stripe Payment Intent creation failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Stripe test error:', error.message);
        return false;
    }
}

// Test PayPal order creation
async function testPayPalOrderCreation() {
    console.log('\n🧪 Testing PayPal Order Creation...');
    
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/payment/paypal/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: 1.00,
                currency: 'USD',
                plan_name: 'Test Plan',
                coupon_code: 'test'
            })
        });
        
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 201 && response.data.order_id) {
            console.log('✅ PayPal Order created successfully!');
            console.log(`Order ID: ${response.data.order_id}`);
            return true;
        } else {
            console.log('❌ PayPal Order creation failed');
            return false;
        }
    } catch (error) {
        console.log('❌ PayPal test error:', error.message);
        return false;
    }
}

// Test backend health
async function testBackendHealth() {
    console.log('🏥 Testing Backend Health...');
    
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/health`);
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Backend is healthy!');
            return true;
        } else {
            console.log('❌ Backend health check failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Backend health check error:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Payment Backend Tests...\n');
    
    const results = {
        backendHealth: await testBackendHealth(),
        stripePayment: await testStripePaymentIntent(),
        paypalOrder: await testPayPalOrderCreation()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Backend Health: ${results.backendHealth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Stripe Payment: ${results.stripePayment ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PayPal Order: ${results.paypalOrder ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 Your payment system is ready for testing!');
        console.log('You can now use the test-payment-verification.html file to test payments.');
    } else {
        console.log('\n⚠️  Some issues need to be fixed before testing payments.');
    }
}

// Run the tests
runAllTests().catch(console.error);
