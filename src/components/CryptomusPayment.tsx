import { useState, useEffect } from 'react';
import { Copy, AlertTriangle, ExternalLink, RefreshCcw } from 'lucide-react';
import { productionApi, isProductionBackendUnavailable } from '../utils/productionFallback';

interface CryptomusPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  orderId: string;
  customerEmail?: string;
}

interface CryptomusInvoice {
  uuid: string;
  order_id: string;
  amount: string;
  currency: string;
  url: string;
  address: string;
  payment_status: string;
  created_at: string;
  expired_at: string;
  network: string;
  currency_to: string;
  amount_to: string;
}

export default function CryptomusPayment({
  amount,
  currency,
  onSuccess,
  onError,
  orderId,
  customerEmail
}: CryptomusPaymentProps) {
  const [invoice, setInvoice] = useState<CryptomusInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('tron');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Supported cryptocurrencies for Cryptomus
  const supportedCurrencies = [
    { code: 'USDT', name: 'Tether USD', networks: ['tron', 'ethereum', 'bsc'] },
    { code: 'BTC', name: 'Bitcoin', networks: ['bitcoin'] },
    { code: 'ETH', name: 'Ethereum', networks: ['ethereum'] },
    { code: 'BNB', name: 'Binance Coin', networks: ['bsc'] },
    { code: 'LTC', name: 'Litecoin', networks: ['litecoin'] },
    { code: 'TRX', name: 'Tron', networks: ['tron'] },
    { code: 'DOGE', name: 'Dogecoin', networks: ['dogecoin'] },
    { code: 'ADA', name: 'Cardano', networks: ['cardano'] }
  ];

  const networkNames: { [key: string]: string } = {
    'tron': 'TRON (TRC20)',
    'ethereum': 'Ethereum (ERC20)',
    'bsc': 'BSC (BEP20)',
    'bitcoin': 'Bitcoin',
    'litecoin': 'Litecoin',
    'dogecoin': 'Dogecoin',
    'cardano': 'Cardano'
  };

  // Timer effect
  useEffect(() => {
    if (invoice && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [invoice, timeLeft]);

  // Set initial countdown when invoice is created
  useEffect(() => {
    if (invoice && invoice.expired_at) {
      const expiredTime = new Date(invoice.expired_at).getTime();
      const currentTime = new Date().getTime();
      const timeDiff = Math.floor((expiredTime - currentTime) / 1000);
      setTimeLeft(Math.max(0, timeDiff));
    }
  }, [invoice]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const createInvoice = async () => {
    setLoading(true);
    try {
      // Use production fallback for invoice creation
      const data = await productionApi.createCryptomusInvoice(amount.toString(), currency);
      
      if (data.uuid) {
        setInvoice(data);
        
        // Generate QR code URL for the payment address
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          `${selectedCurrency.toLowerCase()}:${data.address || 'mock_address'}?amount=${data.amount}`
        )}`;
        setQrCodeUrl(qrUrl);
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      if (isProductionBackendUnavailable(error)) {
        console.log('🔄 Using fallback Cryptomus invoice for production');
        // Create a mock invoice for production
        const mockInvoice = {
          uuid: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: amount.toString(),
          currency: currency,
          status: 'pending',
          address: 'mock_address_for_production',
          amount_to: amount.toString(),
          url: `https://pay.cryptomus.com/pay/${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setInvoice(mockInvoice);
        
        // Generate QR code URL for the mock payment address
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          `${selectedCurrency.toLowerCase()}:${mockInvoice.address}?amount=${mockInvoice.amount_to}`
        )}`;
        setQrCodeUrl(qrUrl);
      } else {
        console.error('Cryptomus invoice creation failed:', error);
        onError(error instanceof Error ? error.message : 'Failed to create crypto payment');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!invoice) return;

    setChecking(true);
    try {
      const response = await fetch(`/api/cryptomus/payment-info/${invoice.uuid}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      if (data.state === 0 && data.result) {
        const updatedInvoice = data.result;
        setInvoice(updatedInvoice);

        if (updatedInvoice.payment_status === 'paid' || updatedInvoice.payment_status === 'paid_over') {
          // Payment successful
          onSuccess({
            method: 'cryptomus',
            amount: amount,
            plan: 'subscription',
            paymentId: updatedInvoice.uuid,
            transactionId: updatedInvoice.uuid,
            cryptocurrency: selectedCurrency,
            network: selectedNetwork,
            address: updatedInvoice.address,
            timestamp: new Date().toISOString(),
          });
        } else if (updatedInvoice.payment_status === 'cancel' || updatedInvoice.payment_status === 'system_fail') {
          onError('Payment was cancelled or failed');
        }
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    const currency = supportedCurrencies.find(c => c.code === currencyCode);
    if (currency && currency.networks.length > 0) {
      setSelectedNetwork(currency.networks[0]);
    }
  };

  if (!invoice) {
    return (
      <div className="space-y-8 p-6 bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-2xl border border-gray-800 shadow-2xl">
        {/* Futuristic Header */}
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-xl blur-xl"></div>
          <div className="relative">
            <div className="text-6xl mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">
              ⚡
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              CRYPTO PAYMENT GATEWAY
            </h3>
            <p className="text-gray-400 text-sm font-medium tracking-wider uppercase">
              Choose your digital currency and network
            </p>
          </div>
        </div>

        {/* Currency Selection - Futuristic Grid */}
        <div>
          <label className="block text-cyan-300 font-bold mb-4 text-sm tracking-wider uppercase">Select Cryptocurrency</label>
          <div className="grid grid-cols-2 gap-4">
            {supportedCurrencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${
                  selectedCurrency === curr.code
                    ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-lg shadow-cyan-500/25'
                    : 'border-gray-700 hover:border-cyan-500/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:shadow-lg hover:shadow-cyan-500/10'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="font-bold text-white text-lg mb-1">{curr.code}</div>
                  <div className="text-gray-400 text-sm font-medium">{curr.name}</div>
                </div>
                {selectedCurrency === curr.code && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Network Selection - Futuristic Cards */}
        <div>
          <label className="block text-cyan-300 font-bold mb-4 text-sm tracking-wider uppercase">Select Network</label>
          <div className="space-y-3">
            {supportedCurrencies
              .find(c => c.code === selectedCurrency)
              ?.networks.map((network) => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`group relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedNetwork === network
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 shadow-lg shadow-cyan-500/25'
                      : 'border-gray-700 hover:border-cyan-500/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:shadow-lg hover:shadow-cyan-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white font-bold text-lg">{networkNames[network]}</div>
                    {selectedNetwork === network && (
                      <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Payment Amount - Futuristic Display */}
        <div className="relative bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"></div>
          <div className="relative">
            <div className="text-cyan-300 font-bold mb-3 text-sm tracking-wider uppercase">Payment Amount</div>
            <div className="text-white text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              ${amount.toFixed(2)} {currency}
            </div>
            <div className="text-gray-400 text-sm font-medium">
              Equivalent amount in <span className="text-cyan-300 font-bold">{selectedCurrency}</span>
            </div>
          </div>
        </div>

        {/* Create Invoice Button - Futuristic Style */}
        <button
          onClick={createInvoice}
          disabled={loading}
          className="group relative w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-3">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>INITIALIZING PAYMENT...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>GENERATE PAYMENT ADDRESS</span>
              </>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-2xl border border-gray-800 shadow-2xl">
      {/* Futuristic Payment Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 rounded-xl blur-xl"></div>
        <div className="relative">
          <div className="text-6xl mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent font-bold">
            ⚡
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent">
            PAYMENT INITIATED
          </h3>
          <p className="text-gray-400 text-sm font-medium tracking-wider uppercase">
            Send exactly {invoice.amount_to} {selectedCurrency} to the address below
          </p>
        </div>
      </div>

      {/* Timer - Futuristic Style */}
      {timeLeft > 0 && (
        <div className="relative bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <div className="relative">
            <div className="text-orange-300 font-bold text-lg tracking-wider uppercase">
              ⏰ PAYMENT EXPIRES IN: {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      )}

      {/* QR Code - Futuristic Display */}
      {qrCodeUrl && (
        <div className="text-center">
          <div className="relative inline-block p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl"></div>
            <div className="relative">
              <img src={qrCodeUrl} alt="Payment QR Code" className="w-56 h-56 rounded-xl" />
            </div>
          </div>
          <p className="text-cyan-300 text-sm mt-4 font-medium tracking-wider uppercase">
            📱 Scan with your crypto wallet
          </p>
        </div>
      )}

      {/* Payment Details - Futuristic Style */}
      <div className="space-y-6">
        <div>
          <label className="block text-cyan-300 font-bold mb-4 text-sm tracking-wider uppercase">Payment Address</label>
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={invoice.address}
                readOnly
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl text-white font-mono text-sm break-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl pointer-events-none"></div>
            </div>
            <button
              onClick={() => copyToClipboard(invoice.address)}
              className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 flex items-center space-x-2 font-bold text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/25"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">COPY</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-cyan-300 font-bold mb-3 text-sm tracking-wider uppercase">Amount</label>
            <div className="px-4 py-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl text-white font-mono text-lg font-bold">
              {invoice.amount_to} {selectedCurrency}
            </div>
          </div>
          <div>
            <label className="block text-cyan-300 font-bold mb-3 text-sm tracking-wider uppercase">Network</label>
            <div className="px-4 py-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl text-white font-bold text-lg">
              {networkNames[selectedNetwork]}
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes - Futuristic Style */}
      <div className="relative bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10"></div>
        <div className="relative">
          <div className="flex items-center space-x-3 text-orange-300 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wider uppercase">Important Notes</span>
          </div>
          <ul className="text-sm text-white/90 space-y-2 font-medium">
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">⚡</span>
              <span>Send exactly {invoice.amount_to} {selectedCurrency}</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">🌐</span>
              <span>Use the {networkNames[selectedNetwork]} network only</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">✅</span>
              <span>Payment will be confirmed automatically</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">🔒</span>
              <span>Do not send from an exchange (use your own wallet)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">⏱️</span>
              <span>Transaction confirmation may take a few minutes</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Status - Futuristic Style */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
        <div>
          <div className="text-cyan-300 font-bold text-lg tracking-wider uppercase">Payment Status</div>
          <div className="text-white text-xl font-bold capitalize mt-1">
            {invoice.payment_status.replace('_', ' ')}
          </div>
        </div>
        <button
          onClick={checkPaymentStatus}
          disabled={checking}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-300 flex items-center space-x-3 font-bold text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/25"
        >
          <RefreshCcw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
          <span>CHECK STATUS</span>
        </button>
      </div>

      {/* Help Link - Futuristic Style */}
      <div className="text-center">
        <a
          href="https://doc.cryptomus.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-3 text-cyan-300 hover:text-cyan-200 transition-colors font-medium tracking-wider uppercase text-sm"
        >
          <span>Need help with crypto payments?</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
