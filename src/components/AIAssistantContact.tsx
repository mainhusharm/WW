import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Phone, 
  Mail, 
  Video, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  TrendingUp,
  X,
  Minimize2,
  Maximize2,
  Settings,
  HelpCircle,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: string[];
  quickReplies?: string[];
  aiConfidence?: number;
  resolution?: string;
}

interface ContactMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  available: boolean;
  responseTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const AIAssistantContact: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [currentUser, setCurrentUser] = useState({
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    plan: 'Professional',
    avatar: 'JS'
  });
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([
    {
      id: 'chat',
      name: 'Live Chat',
      icon: MessageCircle,
      description: 'Instant AI assistance',
      available: true,
      responseTime: '< 2 seconds',
      priority: 'high'
    },
    {
      id: 'email',
      name: 'Email Support',
      icon: Mail,
      description: 'Detailed assistance via email',
      available: true,
      responseTime: '< 1 hour',
      priority: 'medium'
    },
    {
      id: 'phone',
      name: 'Phone Support',
      icon: Phone,
      description: 'Voice assistance (Premium)',
      available: currentUser.plan === 'Elite',
      responseTime: '< 5 minutes',
      priority: 'urgent'
    },
    {
      id: 'video',
      name: 'Video Call',
      icon: Video,
      description: 'Face-to-face support (Elite)',
      available: currentUser.plan === 'Elite',
      responseTime: '< 10 minutes',
      priority: 'urgent'
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Simulate AI responses
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    setIsTyping(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      `I understand your concern about "${userMessage}". Let me help you with that right away.`,
      `I've analyzed your query and I have a solution for you. Here's what I can do:`,
      `Great question! I can definitely help you with that. Let me provide you with the best solution.`,
      `I see what you're looking for. I have several options that might work for you.`,
      `That's a common issue, and I have the perfect solution for you.`
    ];
    
    const solutions = [
      `I've identified the issue and applied a fix. Please try refreshing your browser and let me know if you need anything else.`,
      `I've updated your account settings and the changes should take effect immediately. You can now access all premium features.`,
      `I've processed your request and sent you an email with detailed instructions. Check your inbox in a few minutes.`,
      `I've escalated this to our specialized team and they'll contact you within 2 hours with a detailed solution.`,
      `I've implemented a temporary workaround while we work on a permanent fix. This should resolve your issue for now.`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const randomSolution = solutions[Math.floor(Math.random() * solutions.length)];
    
    setIsTyping(false);
    return `${randomResponse}\n\n${randomSolution}`;
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Generate AI response
    const aiResponse = await generateAIResponse(inputMessage);
    
    const aiMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      type: 'ai',
      content: aiResponse,
      timestamp: new Date(),
      status: 'delivered',
      aiConfidence: Math.floor(Math.random() * 20) + 80,
      quickReplies: [
        'Thank you!',
        'That helped!',
        'I need more help',
        'Close ticket'
      ]
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  // Handle quick replies
  const handleQuickReply = (reply: string) => {
    if (reply === 'Close ticket') {
      const systemMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'system',
        content: 'Ticket closed. Thank you for contacting us!',
        timestamp: new Date(),
        status: 'delivered'
      };
      setMessages(prev => [...prev, systemMessage]);
    } else {
      setInputMessage(reply);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get AI status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'busy': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <>
      {/* Floating Contact Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-semibold">Ask AI Assistant</span>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(aiStatus)}`}></div>
                  <span className="text-sm opacity-90">
                    {aiStatus === 'online' ? 'Online' : aiStatus === 'busy' ? 'Busy' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Contact Methods */}
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Options</h4>
                <div className="grid grid-cols-2 gap-2">
                  {contactMethods.map(method => (
                    <button
                      key={method.id}
                      disabled={!method.available}
                      className={`p-2 rounded-lg text-left transition-all ${
                        method.available
                          ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                          : 'bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <method.icon className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-xs font-medium">{method.name}</div>
                          <div className="text-xs text-gray-500">{method.responseTime}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-80">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">Hi! I'm your AI assistant. How can I help you today?</p>
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => setInputMessage("I need help with my account")}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                      >
                        Account Help
                      </button>
                      <button
                        onClick={() => setInputMessage("I have a technical issue")}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                      >
                        Technical Issue
                      </button>
                      <button
                        onClick={() => setInputMessage("I want to upgrade my plan")}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                            : message.type === 'ai'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'ai' && (
                            <Bot className="w-4 h-4 mt-1 text-cyan-500" />
                          )}
                          {message.type === 'user' && (
                            <User className="w-4 h-4 mt-1 text-white" />
                          )}
                          {message.type === 'system' && (
                            <CheckCircle className="w-4 h-4 mt-1 text-yellow-500" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            {message.aiConfidence && (
                              <div className="mt-2 text-xs opacity-75">
                                AI Confidence: {message.aiConfidence}%
                              </div>
                            )}
                            {message.quickReplies && message.type === 'ai' && (
                              <div className="mt-2 space-x-1">
                                {message.quickReplies.map((reply, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleQuickReply(reply)}
                                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
                                  >
                                    {reply}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-cyan-500" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIAssistantContact;
