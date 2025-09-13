import { useState, useEffect } from 'react';
import { Copy, AlertTriangle, ExternalLink, RefreshCcw } from 'lucide-react';

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
      // Call your backend endpoint to create Cryptomus invoice
      const response = await fetch('/api/cryptomus/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount.toString(),
          currency,
          order_id: orderId,
          currency_to: selectedCurrency,
          network: selectedNetwork,
          url_callback: `${window.location.origin}/api/cryptomus/webhook`,
          url_success: `${window.location.origin}/successful-payment`,
          url_return: `${window.location.origin}/payment`,
          email: customerEmail,
          is_payment_multiple: false,
          lifetime: 3600, // 1 hour
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const data = await response.json();
      if (data.state === 0 && data.result) {
        setInvoice(data.result);
        
        // Generate QR code URL for the payment address
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          `${selectedCurrency.toLowerCase()}:${data.result.address}?amount=${data.result.amount_to}`
        )}`;
        setQrCodeUrl(qrUrl);
      } else {
        throw new Error(data.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Cryptomus invoice creation failed:', error);
      onError(error instanceof Error ? error.message : 'Failed to create crypto payment');
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
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">₿</div>
          <h3 className="text-white font-semibold text-lg mb-2">Pay with Cryptocurrency</h3>
          <p className="text-white/70 text-sm mb-6">
            Choose your preferred cryptocurrency and network for payment
          </p>
        </div>

        {/* Currency Selection */}
        <div>
          <label className="block text-white font-medium mb-3">Select Cryptocurrency</label>
          <div className="grid grid-cols-2 gap-3">
            {supportedCurrencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedCurrency === curr.code
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                }`}
              >
                <div className="font-medium text-white">{curr.code}</div>
                <div className="text-white/60 text-sm">{curr.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Network Selection */}
        <div>
          <label className="block text-white font-medium mb-3">Select Network</label>
          <div className="space-y-2">
            {supportedCurrencies
              .find(c => c.code === selectedCurrency)
              ?.networks.map((network) => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedNetwork === network
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/20 hover:border-white/40 bg-white/5'
                  }`}
                >
                  <div className="text-white font-medium">{networkNames[network]}</div>
                </button>
              ))}
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="text-blue-300 font-medium mb-2">Payment Amount</div>
          <div className="text-white text-xl font-bold">
            ${amount.toFixed(2)} {currency}
          </div>
          <div className="text-white/70 text-sm mt-1">
            You'll pay the equivalent amount in {selectedCurrency}
          </div>
        </div>

        {/* Create Invoice Button */}
        <button
          onClick={createInvoice}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Payment...</span>
            </>
          ) : (
            <span>Generate Payment Address</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">₿</div>
        <h3 className="text-white font-semibold text-lg mb-2">
          Pay with {selectedCurrency}
        </h3>
        <p className="text-white/70 text-sm">
          Send exactly {invoice.amount_to} {selectedCurrency} to the address below
        </p>
      </div>

      {/* Timer */}
      {timeLeft > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
          <div className="text-yellow-300 font-medium">
            Payment expires in: {formatTime(timeLeft)}
          </div>
        </div>
      )}

      {/* QR Code */}
      {qrCodeUrl && (
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
          </div>
          <p className="text-white/70 text-sm mt-2">Scan with your crypto wallet</p>
        </div>
      )}

      {/* Payment Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-white/80 font-medium mb-2">Payment Address</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={invoice.address}
              readOnly
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm break-all"
            />
            <button
              onClick={() => copyToClipboard(invoice.address)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/80 font-medium mb-2">Amount</label>
            <div className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono">
              {invoice.amount_to} {selectedCurrency}
            </div>
          </div>
          <div>
            <label className="block text-white/80 font-medium mb-2">Network</label>
            <div className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              {networkNames[selectedNetwork]}
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-300 mb-3">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Important Notes</span>
        </div>
        <ul className="text-sm text-white/80 space-y-1">
          <li>• Send exactly {invoice.amount_to} {selectedCurrency}</li>
          <li>• Use the {networkNames[selectedNetwork]} network only</li>
          <li>• Payment will be confirmed automatically</li>
          <li>• Do not send from an exchange (use your own wallet)</li>
          <li>• Transaction confirmation may take a few minutes</li>
        </ul>
      </div>

      {/* Payment Status */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
        <div>
          <div className="text-white font-medium">Payment Status</div>
          <div className="text-white/70 text-sm capitalize">
            {invoice.payment_status.replace('_', ' ')}
          </div>
        </div>
        <button
          onClick={checkPaymentStatus}
          disabled={checking}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <RefreshCcw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>Check Status</span>
        </button>
      </div>

      {/* Help Link */}
      <div className="text-center">
        <a
          href="https://doc.cryptomus.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-blue-300 hover:text-blue-200 transition-colors"
        >
          <span>Need help with crypto payments?</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
