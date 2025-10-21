import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { testGeminiApiKey, getUserApiKey, saveUserApiKey, removeUserApiKey } from '../utils/apiKeyTest';

interface ApiKeySetupProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet, currentApiKey }) => {
  const { user } = useUser();
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    // Load saved API key from localStorage
    if (user?.email) {
      const savedKey = getUserApiKey(user.email);
      if (savedKey) {
        setApiKey(savedKey);
        setValidationStatus('valid');
      }
    }
  }, [user]);

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setValidationStatus('idle');
      setValidationMessage('');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      const result = await testGeminiApiKey(key);
      
      if (result.valid) {
        setValidationStatus('valid');
        setValidationMessage(result.message);
        
        // Save to localStorage
        if (user?.email) {
          saveUserApiKey(user.email, key);
        }
        
        onApiKeySet(key);
      } else {
        setValidationStatus('invalid');
        setValidationMessage(result.message);
      }
    } catch (error) {
      setValidationStatus('error');
      setValidationMessage('Failed to validate API key. Please check your connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    
    // Clear validation status when user starts typing
    if (validationStatus !== 'idle') {
      setValidationStatus('idle');
      setValidationMessage('');
    }
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      validateApiKey(apiKey.trim());
    }
  };

  const handleClear = () => {
    setApiKey('');
    setValidationStatus('idle');
    setValidationMessage('');
    
    // Remove from localStorage
    if (user?.email) {
      removeUserApiKey(user.email);
    }
  };

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'invalid':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'border-green-500 bg-green-500/10';
      case 'invalid':
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-600 bg-gray-800/50';
    }
  };

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Key className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Google Gemini API Key Setup</h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-gray-300 mb-4">
            To use the AI Coach, you need to provide your own Google Gemini API key. This ensures the service works reliably for all users.
          </p>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-blue-400 font-semibold mb-2">How to get your API key:</h4>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline inline-flex items-center">
                Google AI Studio <ExternalLink className="w-3 h-3 ml-1" />
              </a></li>
              <li>Sign in with your Google account</li>
              <li>Click "Create API Key"</li>
              <li>Copy the generated API key</li>
              <li>Paste it in the field below</li>
            </ol>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your Gemini API key here..."
                className={`w-full px-4 py-3 pr-20 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${getValidationColor()}`}
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                disabled={isValidating}
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {isValidating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                ) : (
                  getValidationIcon()
                )}
              </div>
            </div>
          </div>

          {validationMessage && (
            <div className={`text-sm p-3 rounded-lg ${
              validationStatus === 'valid' 
                ? 'bg-green-900/20 text-green-300 border border-green-500/30' 
                : 'bg-red-900/20 text-red-300 border border-red-500/30'
            }`}>
              {validationMessage}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || isValidating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-white"
            >
              {isValidating ? 'Validating...' : 'Save & Validate'}
            </button>
            
            {apiKey && (
              <button
                onClick={handleClear}
                disabled={isValidating}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-semibold mb-2">Important Notes:</h4>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Your API key is stored locally in your browser and never sent to our servers</li>
            <li>You are responsible for your own API usage and costs</li>
            <li>Keep your API key secure and don't share it with others</li>
            <li>You can revoke or regenerate your API key anytime from Google AI Studio</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
