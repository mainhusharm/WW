import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Mail,
  Phone,
  Video,
  Bot,
  Clock,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Users,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Share2
} from 'lucide-react';

const HelpAndContact: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('chat');

  const contactMethods = [
    {
      id: 'chat',
      name: 'Live AI Chat',
      icon: MessageCircle,
      description: 'Instant AI assistance with 2-second response time',
      availability: '24/7 Available',
      responseTime: '< 2 seconds',
      features: ['Instant responses', 'AI-powered solutions', 'Multi-language support', 'Context awareness'],
      color: 'from-cyan-500 to-blue-500',
      status: 'online'
    },
    {
      id: 'email',
      name: 'Email Support',
      icon: Mail,
      description: 'Detailed assistance via email with AI analysis',
      availability: '24/7 Available',
      responseTime: '< 1 hour',
      features: ['Detailed responses', 'File attachments', 'Email tracking', 'Priority handling'],
      color: 'from-green-500 to-emerald-500',
      status: 'online'
    },
    {
      id: 'phone',
      name: 'Phone Support',
      icon: Phone,
      description: 'Voice assistance with AI-powered call routing',
      availability: 'Premium & Elite Plans',
      responseTime: '< 5 minutes',
      features: ['Voice AI assistant', 'Call recording', 'Callback service', 'Priority queue'],
      color: 'from-purple-500 to-pink-500',
      status: 'premium'
    },
    {
      id: 'video',
      name: 'Video Call',
      icon: Video,
      description: 'Face-to-face support with AI screen sharing',
      availability: 'Elite Plan Only',
      responseTime: '< 10 minutes',
      features: ['Screen sharing', 'AI co-pilot', 'Recording available', 'Whiteboard support'],
      color: 'from-orange-500 to-red-500',
      status: 'elite'
    }
  ];

  const aiCapabilities = [
    {
      category: 'Account Support',
      icon: Users,
      capabilities: [
        'Account setup and configuration',
        'Password reset and security',
        'Profile management',
        'Subscription upgrades/downgrades',
        'Payment and billing issues'
      ]
    },
    {
      category: 'Technical Support',
      icon: Zap,
      capabilities: [
        'Platform troubleshooting',
        'API integration help',
        'Performance optimization',
        'Bug reporting and fixes',
        'System configuration'
      ]
    },
    {
      category: 'Trading Support',
      icon: TrendingUp,
      capabilities: [
        'Trading platform guidance',
        'Risk management advice',
        'Strategy implementation',
        'Market analysis tools',
        'Portfolio optimization'
      ]
    },
    {
      category: 'Security & Safety',
      icon: Shield,
      capabilities: [
        'Security best practices',
        'Fraud prevention',
        'Data protection',
        'Compliance guidance',
        'Incident response'
      ]
    }
  ];

  const stats = [
    { label: 'Response Time', value: '< 2 seconds', icon: Clock },
    { label: 'Resolution Rate', value: '95%', icon: CheckCircle },
    { label: 'Satisfaction', value: '98%', icon: Star },
    { label: 'Uptime', value: '99.9%', icon: Shield }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 py-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Get Help from <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">AI Assistant</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our AI assistant is available 24/7 to help you with any questions or issues. 
            Choose your preferred contact method below.
          </p>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
              <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Contact Methods */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Contact Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedMethod === method.id
                    ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-purple-500/20'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
                }`}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${method.color} flex items-center justify-center`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{method.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{method.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Availability:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        method.status === 'online' ? 'bg-green-500/20 text-green-400' :
                        method.status === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {method.availability}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Response Time:</span>
                      <span className="text-cyan-400 font-medium">{method.responseTime}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {method.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-xs text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {method.id === 'chat' && (
                    <button className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105">
                      Start Chat Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Capabilities */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">What Our AI Can Help You With</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiCapabilities.map((category, idx) => (
              <div key={idx} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <category.icon className="w-8 h-8 text-cyan-400 mr-3" />
                  <h3 className="text-xl font-semibold">{category.category}</h3>
                </div>
                <div className="space-y-2">
                  {category.capabilities.map((capability, capIdx) => (
                    <div key={capIdx} className="flex items-start text-sm text-gray-300">
                      <ArrowRight className="w-4 h-4 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                      {capability}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-400 text-sm mb-4">Click the chat button in the bottom right corner</p>
              <Link to="/contact-support">
                <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300">
                  Open Chat
                </button>
              </Link>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-gray-400 text-sm mb-4">Send us an email for detailed assistance</p>
              <div className="flex items-center justify-center space-x-2">
                <code className="bg-gray-800 px-3 py-1 rounded text-sm">support@traderedgepro.com</code>
                <button 
                  onClick={() => copyToClipboard('support@traderedgepro.com')}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Help Center</h3>
              <p className="text-gray-400 text-sm mb-4">Browse our knowledge base and FAQs</p>
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300">
                Visit Help Center
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Need More Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-cyan-400" />
                AI Assistant Dashboard
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Monitor all conversations and AI performance in real-time
              </p>
              <button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300">
                Open Dashboard
              </button>
            </div>

            <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ExternalLink className="w-5 h-5 mr-2 text-green-400" />
                Share Feedback
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Help us improve our AI assistant by sharing your experience
              </p>
              <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300">
                Share Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAndContact;
