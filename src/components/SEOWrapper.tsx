import React from 'react';
import { SEO } from './SEO';
import { useWebVitals, usePreloadResources } from './OptimizedImage';

interface SEOWrapperProps {
  children: React.ReactNode;
  pageType?: 'home' | 'features' | 'about' | 'contact' | 'blog';
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string[];
  customImage?: string;
}

export const SEOWrapper: React.FC<SEOWrapperProps> = ({
  children,
  pageType = 'home',
  customTitle,
  customDescription,
  customKeywords,
  customImage
}) => {
  // Initialize Web Vitals tracking
  useWebVitals();

  // Preload critical resources
  usePreloadResources([
    '/logo.png',
    '/src/main.tsx',
    '/src/index.css'
  ]);

  // Dynamic SEO data based on page type
  const getSEOData = () => {
    switch (pageType) {
      case 'features':
        return {
          title: 'AI-Powered Trading Features - Risk Management & Signals | TraderEdge Pro',
          description: 'Explore advanced AI trading features including real-time signals, risk management tools, and automated trade execution. Join 2,847+ successful traders.',
          keywords: ['AI trading features', 'risk management tools', 'trading signals', 'automated trading']
        };

      case 'about':
        return {
          title: 'About TraderEdge Pro - Professional Prop Firm Clearing Service',
          description: 'Learn about our mission to help traders clear prop firm challenges with AI-powered tools and expert guidance. 94% success rate achieved.',
          keywords: ['about us', 'prop firm clearing', 'trading education', 'AI coaching']
        };

      case 'contact':
        return {
          title: 'Contact Support - 24/7 Trading Assistance | TraderEdge Pro',
          description: 'Get in touch with our expert support team. Available 24/7 for trading guidance, technical support, and prop firm challenge assistance.',
          keywords: ['contact support', 'trading help', 'customer service', 'prop firm support']
        };

      default: // home
        return {
          title: customTitle,
          description: customDescription,
          keywords: customKeywords
        };
    }
  };

  const seoData = getSEOData();

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        image={customImage || "https://traderedgepro.com/og-image.jpg"}
      />
      {children}
    </>
  );
};

export default SEOWrapper;
