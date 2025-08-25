import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Award, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative z-50 py-16 px-4 sm:px-6 lg:px-8 bg-gray-950 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <h3 className="text-xl font-bold text-white">TraderEdge Pro</h3>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Professional prop firm clearing service helping traders achieve funded account success through proven methodologies and expert guidance.
            </p>
            <div className="flex items-center space-x-4">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300">Trusted by 2,847+ traders worldwide</span>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">Subscribe to our newsletter</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = (e.target as any).email.value;
                  await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                  });
                  alert('Successfully subscribed!');
                }}
              >
                <div className="flex">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg font-semibold"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About</Link></li>
              <li><Link to="/membership" className="hover:text-blue-400 transition-colors">Trading Plans</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">Progress Tracking</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
                <li><Link to="/contact-support" className="hover:text-blue-400 transition-colors">Contact Support</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            <p>&copy; 2025 TraderEdge Pro. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Trading involves substantial risk. Past performance does not guarantee future results.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
