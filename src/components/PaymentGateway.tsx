import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Bitcoin, Shield, Loader, CreditCard } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import api from '../api';

interface PaymentGatewayProps {
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ onPaymentSuccess, onPaymentError }) => {
  const { user } = useUser();
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'coingate'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(99);
  const [currency, setCurrency] = useState('USD');
  const [transactionHash, setTransactionHash] = useState('');

  const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  const processCoinGatePayment = async () => {
    setIsProcessing(true);
    try {
      const endpoint = selectedMethod === 'coingate' && currency === 'ETH' ? '/crypto-payment/verify-eth-payment' : '/crypto-payment/verify-sol-payment';
      await api.post(endpoint, {
        tx_hash: transactionHash,
        user_id: user?.id,
        plan: 'premium' // This should be dynamic based on the selected plan
      });
      onPaymentSuccess({
        paymentId: transactionHash,
        method: 'CoinGate',
        amount: paymentAmount,
        currency,
      });
    } catch (error) {
      onPaymentError('CoinGate payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'coingate') {
      processCoinGatePayment();
    }
    // For PayPal, the button itself handles the payment flow.
  };

  return (
    <PayPalScriptProvider options={{ "clientId": CLIENT_ID, currency: currency }}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Secure Payment</h2>
            <p className="text-gray-400">Choose your preferred payment method</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setSelectedMethod('paypal')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedMethod === 'paypal'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <CreditCard className={`w-8 h-8 ${selectedMethod === 'paypal' ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className="text-white font-semibold text-lg">PayPal</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">Pay with your PayPal account</p>
              <p className="text-xs text-gray-500">No additional fees</p>
            </button>
            <button
              onClick={() => setSelectedMethod('coingate')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedMethod === 'coingate'
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Bitcoin className={`w-8 h-8 ${selectedMethod === 'coingate' ? 'text-orange-400' : 'text-gray-400'}`} />
                <span className="text-white font-semibold text-lg">Cryptocurrency</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">Ethereum (ETH), Solana (SOL)</p>
              <p className="text-xs text-gray-500">Manual verification required</p>
            </button>
          </div>

          {/* Payment Amount */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">Payment Amount</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  min="1"
                  step="0.01"
                />
              </div>
              <div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {selectedMethod === 'paypal' && (
            <div className="mb-8 p-4 bg-blue-600/20 border border-blue-600 rounded-lg">
              <p className="text-sm text-gray-300 text-center">
                You'll be redirected to PayPal to complete your payment.
              </p>
            </div>
          )}
          {selectedMethod === 'coingate' && (
            <div className="mb-8 p-4 bg-orange-600/20 border border-orange-600 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-400 mb-2">
                <Bitcoin className="w-5 h-5" />
                <span className="font-semibold">Cryptocurrency Payment</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• ETH: 0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256</li>
                <li>• SOL: GZGsfmqx6bAYdXiVQs3QYfPFPjyfQggaMtBp5qm5R7r3</li>
              </ul>
              <div className="mt-4">
                <input
                  type="text"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="Enter transaction hash"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
          {/* Security Notice */}
          <div className="mb-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-2 text-green-400 mb-2">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Secure Payment</span>
            </div>
            <p className="text-sm text-gray-300">
              Your payment information is encrypted and secure. We use industry-standard SSL encryption and never store your payment details.
            </p>
          </div>
          {/* Payment Button */}
          {selectedMethod === 'paypal' && (
            <PayPalButtons
              style={{ layout: "horizontal" }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [{
                    amount: {
                      value: paymentAmount.toString(),
                      currency_code: currency,
                    },
                  }],
                });
              }}
              onApprove={(data, actions) => {
                if (actions.order) {
                  return actions.order.capture().then((details) => {
                    onPaymentSuccess({
                      paymentId: details.id,
                      method: 'PayPal',
                      amount: paymentAmount,
                      currency,
                    });
                  });
                }
                return Promise.resolve();
              }}
              onError={(err) => {
                onPaymentError("PayPal transaction failed.");
              }}
            />
          )}
          {selectedMethod === 'coingate' && (
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Bitcoin className="w-5 h-5" />
                  <span>Pay with Crypto</span>
                </>
              )}
            </button>
          )}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default PaymentGateway;
