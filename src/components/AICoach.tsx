import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model: string;
    tokens: number;
    responseTime: number;
  };
}

const AICoach: React.FC = () => {
  const { user } = useUser();
  const { tradingPlan } = useTradingPlan();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Gemini API configuration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  useEffect(() => {
    // Generate session ID for this conversation
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.email?.split('@')[0] || 'Trader'}! I'm your AI Trading Coach. I'm here to help you with trading strategies, risk management, and market analysis. What would you like to discuss today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user]);

  const generateUserContext = () => {
    const userContext = {
      username: user?.email?.split('@')[0] || 'Trader',
      experience: tradingPlan?.userProfile?.experience || 'beginner',
      accountSize: tradingPlan?.userProfile?.accountEquity || tradingPlan?.userProfile?.initialBalance || 'Not specified',
      riskTolerance: tradingPlan?.riskParameters?.maxDailyRisk || 'Not specified',
      preferredMarkets: ['forex', 'crypto'] // Default markets
    };

    return `User Context: ${JSON.stringify(userContext, null, 2)}`;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !GEMINI_API_KEY) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert trading coach. Use this context to provide personalized advice: ${generateUserContext()}\n\nUser Question: ${inputMessage}\n\nProvide a helpful, actionable response focused on trading education and strategy.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date(),
          metadata: {
            model: 'gemini-pro',
            tokens: data.usageMetadata?.totalTokenCount || 0,
            responseTime
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or check your API configuration. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.email?.split('@')[0] || 'Trader'}! I'm your AI Trading Coach. I'm here to help you with trading strategies, risk management, and market analysis. What would you like to discuss today?`,
      timestamp: new Date()
    }]);
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  };

  if (!GEMINI_API_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ API Key Required</h2>
            <p className="text-gray-300 mb-4">
              The Gemini API key is not configured. Please add your API key to the environment variables.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 text-left text-sm">
              <p className="text-gray-400 mb-2">Required environment variable:</p>
              <code className="text-green-400">VITE_GEMINI_API_KEY</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Trading Coach
              </h1>
              <p className="text-gray-400 mt-2">
                Your personalized AI assistant for trading strategies and market insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Session ID</p>
                <p className="text-xs text-gray-500 font-mono">{sessionId}</p>
              </div>
              <button
                onClick={clearConversation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                New Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.metadata && (
                    <div className="mt-2 text-xs opacity-70">
                      <span className="mr-3">Model: {message.metadata.model}</span>
                      <span className="mr-3">Tokens: {message.metadata.tokens}</span>
                      <span>Response: {message.metadata.responseTime}ms</span>
                    </div>
                  )}
                  <div className="text-xs opacity-50 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex space-x-4">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about trading strategies, risk management, market analysis, or any trading-related questions..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* User Context Display */}
        <div className="mt-6 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Your Trading Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Username:</span>
              <p className="text-white">{user?.email?.split('@')[0] || 'Not set'}</p>
            </div>
            <div>
              <span className="text-gray-400">Experience:</span>
              <p className="text-white">{tradingPlan?.userProfile?.experience || 'Not set'}</p>
            </div>
            <div>
              <span className="text-gray-400">Account Size:</span>
              <p className="text-white">{tradingPlan?.userProfile?.accountEquity || tradingPlan?.userProfile?.initialBalance || 'Not set'}</p>
            </div>
            <div>
              <span className="text-gray-400">Risk Tolerance:</span>
              <p className="text-white">{tradingPlan?.riskParameters?.maxDailyRisk || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
