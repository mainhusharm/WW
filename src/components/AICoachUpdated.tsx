import React, { useState, useEffect } from 'react';
import { Key, Cpu, Settings, Zap, MessageCircle, Send, Trash2, Download, Upload, Brain, Target, TrendingUp, AlertTriangle, CheckCircle, Clock, User, Bot } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import ApiKeySetup from './ApiKeySetup';
import { getUserApiKey } from '../utils/apiKeyTest';
import geminiService, { GeminiModel, GeminiRequest } from '../services/geminiService';

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

const AICoachUpdated: React.FC = () => {
  const { user } = useUser();
  const { tradingPlan } = useTradingPlan();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);

  useEffect(() => {
    // Load user's API key from localStorage
    if (user?.email) {
      const savedKey = getUserApiKey(user.email);
      if (savedKey) {
        setUserApiKey(savedKey);
        geminiService.setApiKey(savedKey);
      }
    }
    
    // Load available models
    setAvailableModels(geminiService.getAvailableModels());
  }, [user]);

  useEffect(() => {
    // Generate session ID for this conversation
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name || user?.email?.split('@')[0] || 'Trader'}! I'm your AI Trading Coach powered by ${selectedModel}. I'm here to help you with trading strategies, risk management, and market analysis. What would you like to discuss today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user, selectedModel]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userApiKey) return;

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
      // Set the API key in the service
      geminiService.setApiKey(userApiKey);
      
      // Create the request
      const request: GeminiRequest = {
        prompt: geminiService.createTradingPrompt({
          username: user?.email?.split('@')[0] || 'Trader',
          experience: tradingPlan?.userProfile?.experience || 'beginner',
          accountSize: tradingPlan?.userProfile?.accountEquity || tradingPlan?.userProfile?.initialBalance || 'Not specified',
          riskTolerance: tradingPlan?.riskParameters?.maxDailyRisk || 'Not specified',
          preferredMarkets: ['forex', 'crypto']
        }, inputMessage),
        model: selectedModel,
        temperature: 0.7,
        maxTokens: 1024
      };

      // Generate content using the service
      const response = await geminiService.generateContent(request);

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        metadata: {
          model: response.model,
          tokens: response.tokens,
          responseTime: response.responseTime
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
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

  const clearMessages = () => {
    setMessages([]);
  };

  const exportMessages = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-coach-conversation-${sessionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getModelDisplayName = (modelName: string): string => {
    const model = availableModels.find(m => m.name === modelName);
    return model ? model.displayName : modelName;
  };

  if (!userApiKey) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ApiKeySetup 
            onApiKeySet={(key) => {
              setUserApiKey(key);
              geminiService.setApiKey(key);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold">AI Trading Coach</h1>
              <p className="text-sm text-gray-400">
                Powered by {getModelDisplayName(selectedModel)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                <Cpu className="w-4 h-4" />
                <span className="text-sm">{getModelDisplayName(selectedModel)}</span>
                <Settings className="w-4 h-4" />
              </button>
              
              {showModelSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs text-gray-400 mb-2 px-2">Select Model:</div>
                    {availableModels.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => {
                          setSelectedModel(model.name);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedModel === model.name
                            ? 'bg-cyan-600 text-white'
                            : 'hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <div className="font-medium">{model.displayName}</div>
                        <div className="text-xs text-gray-400">{model.description}</div>
                        {model.isExperimental && (
                          <div className="text-xs text-yellow-400">Experimental</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={exportMessages}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Export Conversation"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={clearMessages}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Clear Messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-200px)]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                )}
                {message.role === 'user' && (
                  <User className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.metadata && (
                    <div className="mt-2 text-xs opacity-70 flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Cpu className="w-3 h-3" />
                        <span>{message.metadata.model}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>{message.metadata.tokens} tokens</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{message.metadata.responseTime}ms</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about trading..."
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoachUpdated;
