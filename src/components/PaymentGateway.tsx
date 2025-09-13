import React, { useState } from 'react';
// PayPal imports removed
import { Bitcoin, Shield, Loader, CreditCard } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import api from '../api';

interface PaymentGatewayProps {
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ onPaymentSuccess, onPaymentError }) => {
  const { user } = useUser();
  const [selectedMethod, setSelectedMethod] = useState<'coingate'>('coingate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(99);
  const [currency, setCurrency] = useState('USD');
  const [transactionHash, setTransactionHash] = useState('');

  // PayPal CLIENT_ID removed

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
    // PayPal payment flow removed
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Secure Payment</h2>
          <p className="text-gray-400">Choose your preferred payment method</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* PayPal option removed */}
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
          {/* PayPal payment details removed */}
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
          {/* PayPal payment button removed */}
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
    </div>
  );
};

export default PaymentGateway;
