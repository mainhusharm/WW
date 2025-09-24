import React, { useState, useEffect, useRef } from 'react';
import { Key, MessageCircle, Send, Trash2, Download, Upload, Brain, Target, TrendingUp, AlertTriangle, CheckCircle, Clock, User, Bot, Cpu, Settings, Zap } from 'lucide-react';
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

interface TradingSession {
  id: string;
  symbol: string;
  type: string;
  entryPrice: string;
  timestamp: string;
  status: string;
}

const AICoachEnhanced: React.FC = () => {
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
  const [activeSessions, setActiveSessions] = useState<TradingSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messageHistory, setMessageHistory] = useState<Record<string, Message[]>>({});
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [signalContext, setSignalContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Load user's API key from localStorage
      if (user?.email) {
        const savedKey = getUserApiKey(user.email);
        if (savedKey) {
          setUserApiKey(savedKey);
          geminiService.setApiKey(savedKey);
        } else {
          setShowApiKeySetup(true);
        }
      }
      
      // Load available models
      setAvailableModels(geminiService.getAvailableModels());
    } catch (err) {
      console.error('Error initializing AI Coach:', err);
      setError('Failed to initialize AI Coach. Please refresh the page.');
    }
  }, [user]);

  useEffect(() => {
    // Generate session ID for this conversation
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Load existing messages from localStorage if any
    const savedMessages = localStorage.getItem(`ai_coach_messages_${user?.email}`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Error loading saved messages:', error);
        // Add welcome message if no saved messages
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `Hello ${user?.name || user?.email?.split('@')[0] || 'Trader'}! I'm Nexus, your AI Trading Coach powered by ${selectedModel}. I'm here to help you with trading strategies, risk management, and market analysis. What would you like to discuss today?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } else {
      // Add welcome message only if no saved messages
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
          content: `Hello ${user?.name || user?.email?.split('@')[0] || 'Trader'}! I'm Nexus, your AI Trading Coach powered by ${selectedModel}. I'm here to help you with trading strategies, risk management, and market analysis. What would you like to discuss today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user, selectedModel]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && user?.email) {
      localStorage.setItem(`ai_coach_messages_${user.email}`, JSON.stringify(messages));
    }
  }, [messages, user?.email]);

  // Handle signal context from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const signalData = urlParams.get('signal');
    
    if (signalData) {
      try {
        const parsedSignal = JSON.parse(decodeURIComponent(signalData));
        setSignalContext(parsedSignal);
        
        // Only add signal message if there are no existing messages
        const savedMessages = localStorage.getItem(`ai_coach_messages_${user?.email}`);
        if (!savedMessages || JSON.parse(savedMessages).length === 0) {
          const signalMessage: Message = {
            id: `signal_${Date.now()}`,
            role: 'assistant',
            content: `I see you're asking about the ${parsedSignal.pair || parsedSignal.symbol} ${parsedSignal.direction || parsedSignal.action} signal. Let me analyze this setup for you:

**Signal Details:**
- Pair: ${parsedSignal.pair || parsedSignal.symbol}
- Direction: ${parsedSignal.direction || parsedSignal.action}
- Entry: ${parsedSignal.entry || parsedSignal.entryPrice}
- Stop Loss: ${parsedSignal.stopLoss}
- Take Profit: ${parsedSignal.takeProfit}
- Confidence: ${parsedSignal.confidence}%
- Timeframe: ${parsedSignal.timeframe || '1H'}

How can I help you with this signal? Would you like me to analyze the setup, discuss risk management, or provide entry/exit strategies?`,
            timestamp: new Date()
          };
          
          setMessages([signalMessage]);
        } else {
          // If there are existing messages, just set the signal context without adding a message
          console.log('Signal context set for existing chat session');
        }
        
        // Clear URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing signal data:', error);
      }
    }
  }, [user?.email]);

  // Create particles effect
  useEffect(() => {
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
        for (let i = 0; i < 50; i++) {
          const particle = document.createElement('div');
          particle.className = 'particle';
          particle.style.left = Math.random() * 100 + '%';
          particle.style.animationDelay = Math.random() * 20 + 's';
          particle.style.animationDuration = (20 + Math.random() * 10) + 's';
          particlesContainer.appendChild(particle);
        }
      }
    };

    createParticles();
  }, []);

  const createSession = (signalData?: any) => {
    const newSessionId = 'session_' + Date.now();
    const session: TradingSession = {
      id: newSessionId,
      symbol: signalData?.symbol || 'BTC/USD',
      type: signalData?.type || 'BUY',
      entryPrice: signalData?.entryPrice || '42,150',
      timestamp: new Date().toLocaleTimeString(),
      status: 'active'
    };
    
    setActiveSessions(prev => [...prev, session]);
    setMessageHistory(prev => ({ ...prev, [newSessionId]: [] }));
    setCurrentSessionId(newSessionId);
    
    // Send initial greeting for new session
    setTimeout(() => {
      const greetingMessage: Message = {
        id: `greeting_${Date.now()}`,
        role: 'assistant',
        content: `Welcome to your ${session.symbol} ${session.type} trade session! I'm Nexus, your AI trading coach.

I've analyzed your entry at ${session.entryPrice} and I'm here to guide you through this trade. Let me start by giving you a quick market overview and key levels to watch...`,
        timestamp: new Date()
      };
      
      setMessageHistory(prev => ({
        ...prev,
        [newSessionId]: [...(prev[newSessionId] || []), greetingMessage]
      }));
    }, 500);
    
    return newSessionId;
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const sessionMessages = messageHistory[sessionId] || [];
    setMessages(sessionMessages);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userApiKey) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Add to current session
    if (currentSessionId) {
      setMessageHistory(prev => ({
        ...prev,
        [currentSessionId]: [...(prev[currentSessionId] || []), userMessage]
      }));
    }
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Set the API key in the service
      geminiService.setApiKey(userApiKey);
      
      // Get current session context
      const currentSession = activeSessions.find(s => s.id === currentSessionId);
      
      // Create enhanced prompt
      const enhancedPrompt = `You are Nexus, an expert AI trading coach helping with a ${currentSession?.symbol || 'trading'} ${currentSession?.type || ''} position entered at ${currentSession?.entryPrice || 'current price'}. 
      
      Provide professional trading guidance that is:
      1. Specific and actionable
      2. Risk-aware and protective of capital
      3. Based on technical analysis principles
      4. Encouraging but realistic
      
      User question: ${inputMessage}
      
      Format your response with clear sections if needed, use 📊 for key insights, ⚠️ for warnings, and ✅ for confirmations.`;
      
      // Create the request
      const request: GeminiRequest = {
        prompt: enhancedPrompt,
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
      
      // Add to current session
      if (currentSessionId) {
        setMessageHistory(prev => ({
          ...prev,
          [currentSessionId]: [...(prev[currentSessionId] || []), assistantMessage]
        }));
      }
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I'm having trouble connecting to my analysis systems right now. Let me try to help with some general guidance:

📊 **General Trading Tips:**
✅ Always follow your risk management rules
⚠️ Never risk more than your predetermined amount
📈 Wait for clear setups before entering trades
🎯 Stick to your trading plan

Please try asking your question again, and I'll do my best to provide specific guidance.`,
        timestamp: new Date()
      };
      
      // Add to current session
      if (currentSessionId) {
        setMessageHistory(prev => ({
          ...prev,
          [currentSessionId]: [...(prev[currentSessionId] || []), errorMessage]
        }));
      }
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickMessage = (message: string) => {
    setInputMessage(message);
    setTimeout(() => sendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getModelDisplayName = (modelName: string): string => {
    const model = availableModels.find(m => m.name === modelName);
    return model ? model.displayName : modelName;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showApiKeySetup) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ApiKeySetup 
            onApiKeySet={(key) => {
              setUserApiKey(key);
              geminiService.setApiKey(key);
              setShowApiKeySetup(false);
            }}
            currentApiKey={userApiKey}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="nexus-container">
      {/* Animated particles background */}
      <div className="particles" id="particles"></div>

      {/* Trade Sessions Sidebar */}
      <div className="trade-sessions">
        <div className="sessions-header">
          <h2>NEXUS AI Coach</h2>
          <p>Your intelligent trading companion</p>
        </div>
        <div className="sessions-list">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className={`session-card ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => selectSession(session.id)}
            >
              <div className="session-symbol">{session.symbol}</div>
              <div className="session-info">
                <span className={`session-type ${session.type.toLowerCase()}`}>{session.type}</span>
                <span className="session-time">{session.timestamp}</span>
              </div>
              <div className="session-status">
                <span className="status-dot"></span>
                <span>Active • {session.entryPrice}</span>
              </div>
            </div>
          ))}
          <button 
            className="new-session-btn"
            onClick={() => createSession()}
          >
            + New Trade Session
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        <div className="chat-header">
          <div className="ai-status">
            <div className="ai-avatar">N</div>
            <div className="ai-info">
              <h3>Nexus AI Coach</h3>
              <div className="ai-state">
                <span className="status-dot"></span>
                <span id="aiStatus">
                  {isLoading ? 'Analyzing...' : 'Online & Analyzing'}
                </span>
                {isLoading && (
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
              {signalContext && (
                <div className="signal-context mt-2">
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                    📊 {signalContext.pair || signalContext.symbol} {signalContext.direction || signalContext.action}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="trade-metrics">
              <div className="metric">
                <div className="metric-value">78%</div>
                <div className="metric-label">Win Rate</div>
              </div>
              <div className="metric">
                <div className="metric-value">+2.4%</div>
                <div className="metric-label">Today's P&L</div>
              </div>
              <div className="metric">
                <div className="metric-value">2h 15m</div>
                <div className="metric-label">Session Time</div>
              </div>
            </div>
            
            {/* API Key Management */}
            <div className="api-key-section">
              <button
                onClick={() => setShowApiKeySetup(true)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                title="Change API Key"
              >
                <Key className="w-4 h-4" />
                <span className="text-sm">API Key</span>
              </button>
            </div>
          </div>
        </div>

        <div className="messages-container" ref={messagesContainerRef}>
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-bubble">
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                  {message.metadata && (
                    <span className="message-metadata">
                      • {message.metadata.model} • {message.metadata.tokens} tokens • {message.metadata.responseTime}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai">
              <div className="message-bubble">
                <div className="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="quick-actions">
            <button 
              className="quick-action" 
              onClick={() => sendQuickMessage("What's the current market sentiment?")}
            >
              Market Sentiment
            </button>
            <button 
              className="quick-action" 
              onClick={() => sendQuickMessage("Should I adjust my stop loss?")}
            >
              Risk Management
            </button>
            <button 
              className="quick-action" 
              onClick={() => sendQuickMessage("Analyze entry point")}
            >
              Entry Analysis
            </button>
            <button 
              className="quick-action" 
              onClick={() => sendQuickMessage("Exit strategy suggestions")}
            >
              Exit Strategy
            </button>
          </div>
          <div className="input-wrapper">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Nexus about your trade..."
              disabled={isLoading}
            />
            <button 
              className="send-btn" 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nexus-container {
          display: flex;
          height: 100vh;
          position: relative;
          background: radial-gradient(ellipse at top left, #1a1a2e 0%, #0a0a0f 50%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #ffffff;
        }

        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: linear-gradient(45deg, #00ff88, #00ffff);
          border-radius: 50%;
          animation: float 20s infinite linear;
          opacity: 0.3;
        }

        @keyframes float {
          0% { transform: translateY(100vh) translateX(0); }
          100% { transform: translateY(-100px) translateX(100px); }
        }

        .trade-sessions {
          width: 320px;
          background: rgba(20, 20, 30, 0.6);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0, 255, 136, 0.2);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.5s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        .sessions-header {
          padding: 24px;
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 255, 0.1));
          border-bottom: 1px solid rgba(0, 255, 136, 0.2);
        }

        .sessions-header h2 {
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(135deg, #00ff88, #00ffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        .sessions-header p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .sessions-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .session-card {
          background: rgba(30, 30, 45, 0.6);
          border: 1px solid rgba(0, 255, 136, 0.1);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .session-card:hover {
          background: rgba(30, 30, 45, 0.8);
          border-color: rgba(0, 255, 136, 0.3);
          transform: translateY(-2px);
        }

        .session-card.active {
          background: rgba(0, 255, 136, 0.1);
          border-color: #00ff88;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        }

        .session-symbol {
          font-size: 16px;
          font-weight: 600;
          color: #00ff88;
          margin-bottom: 8px;
        }

        .session-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .session-type {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .session-type.buy {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .session-type.sell {
          background: rgba(255, 100, 100, 0.2);
          color: #ff6464;
        }

        .session-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .session-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00ff88;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .new-session-btn {
          background: linear-gradient(135deg, #00ff88, #00ffff);
          color: #000;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: auto;
        }

        .new-session-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 255, 136, 0.3);
        }

        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .chat-header {
          padding: 20px 24px;
          background: rgba(20, 20, 30, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 255, 136, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #00ff88, #00ffff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          position: relative;
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.5); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 136, 0.8); }
        }

        .ai-info h3 {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .ai-state {
          font-size: 12px;
          color: #00ff88;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .thinking-dots {
          display: inline-flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;
          background: #00ff88;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
        .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .trade-metrics {
          display: flex;
          gap: 20px;
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 600;
          color: #00ff88;
        }

        .metric-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          margin-top: 4px;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          animation: messageSlide 0.3s ease;
        }

        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.ai {
          align-self: flex-start;
          max-width: 70%;
        }

        .message.user {
          align-self: flex-end;
          max-width: 70%;
        }

        .message-bubble {
          padding: 16px 20px;
          border-radius: 16px;
          position: relative;
        }

        .message.ai .message-bubble {
          background: rgba(30, 30, 45, 0.8);
          border: 1px solid rgba(0, 255, 136, 0.2);
        }

        .message.user .message-bubble {
          background: linear-gradient(135deg, #00ff88, #00ffff);
          color: #000;
        }

        .message-content {
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 8px;
        }

        .message-metadata {
          font-size: 10px;
          opacity: 0.5;
        }

        .input-container {
          padding: 20px 24px;
          background: rgba(20, 20, 30, 0.8);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(0, 255, 136, 0.1);
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .quick-action {
          background: rgba(30, 30, 45, 0.6);
          border: 1px solid rgba(0, 255, 136, 0.2);
          color: #00ff88;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .quick-action:hover {
          background: rgba(0, 255, 136, 0.1);
          border-color: #00ff88;
        }

        .input-wrapper {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .input-wrapper input {
          flex: 1;
          background: rgba(30, 30, 45, 0.8);
          border: 1px solid rgba(0, 255, 136, 0.2);
          color: white;
          padding: 16px 20px;
          border-radius: 25px;
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .input-wrapper input:focus {
          border-color: #00ff88;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        }

        .input-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .send-btn {
          background: linear-gradient(135deg, #00ff88, #00ffff);
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .send-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 10px 20px rgba(0, 255, 136, 0.3);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default AICoachEnhanced;
