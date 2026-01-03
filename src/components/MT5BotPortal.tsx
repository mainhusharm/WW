import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const MT5BotPortal: React.FC = () => {
  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Advanced",
      subtitle: "Algorithms"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risk",
      subtitle: "Management"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7",
      subtitle: "Trading"
    }
  ];

  const stats = [
    { value: "500+", label: "Bots Created" },
    { value: "98.7%", label: "Success Rate" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="relative bg-black backdrop-blur-sm rounded-3xl border border-purple-500/30 p-8 mb-12 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 rounded-3xl"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-blue-500/20 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
              <div className="w-3 h-3 bg-white rounded-sm"></div>
              <div className="w-3 h-3 bg-white rounded-sm"></div>
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">MT5 Bot Portal</h2>
          <p className="text-lg text-gray-300 mb-2">Access our advanced MT5 bot implementation service</p>
          <p className="text-sm text-gray-400">Professional Expert Advisors built to your exact trading strategy.</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-black backdrop-blur-sm rounded-2xl p-4 text-center border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-purple-400 mb-2 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
              <p className="text-gray-400 text-xs">{feature.subtitle}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mb-8">
          <Link
            to="/mt5-bots"
            className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 hover:border-cyan-400/40 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50"
          >
            <span className="flex items-center">
              <span className="mr-2 font-bold">+</span>
              Access Portal
              <ArrowRight className="w-5 h-5 ml-2" />
            </span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-cyan-400 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MT5BotPortal;
