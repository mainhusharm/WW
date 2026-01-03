import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export const SEO: React.FC<SEOProps> = ({
  title = "TraderEdge Pro - Clear Your Prop Firm Challenge with AI-Powered Precision",
  description = "Professional prop firm clearing service with AI-powered signals, risk management, and 94% success rate. Join 2,847+ successful traders who cleared their challenges.",
  keywords = [
    "prop firm challenge",
    "funded trading account",
    "trading signals",
    "risk management",
    "AI trading coach",
    "forex signals",
    "crypto trading",
    "trading journal",
    "position sizing calculator",
    "trading education"
  ],
  image = "https://traderedgepro.com/og-image.jpg",
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = "TraderEdge Pro",
  section,
  tags
}) => {
  const location = useLocation();
  const currentUrl = url || `https://traderedgepro.com${location.pathname}`;
  const fullTitle = title.includes('TraderEdge Pro') ? title : `${title} | TraderEdge Pro`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', author);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // Open Graph tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'TraderEdge Pro', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@TraderEdgePro');
    updateMetaTag('twitter:creator', '@TraderEdgePro');

    // Article tags
    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, true);
      if (modifiedTime) updateMetaTag('article:modified_time', modifiedTime, true);
      if (author) updateMetaTag('article:author', author, true);
      if (section) updateMetaTag('article:section', section, true);
      if (tags) tags.forEach(tag => updateMetaTag('article:tag', tag, true));
    }

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('googlebot', 'index, follow');
    updateMetaTag('language', 'English');
    updateMetaTag('geo.region', 'US');
    updateMetaTag('geo.placename', 'United States');

    // Update or create JSON-LD scripts
    const updateJsonLdScript = (id: string, data: any) => {
      let script = document.getElementById(id) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    };

    // Financial Service Schema
    updateJsonLdScript('financial-service-schema', {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      "name": "TraderEdge Pro",
      "description": "Professional prop firm clearing service with AI-powered signals and risk management tools.",
      "url": "https://traderedgepro.com",
      "logo": "https://traderedgepro.com/logo.png",
      "sameAs": [
        "https://twitter.com/TraderEdgePro",
        "https://facebook.com/TraderEdgePro",
        "https://instagram.com/TraderEdgePro",
        "https://linkedin.com/company/traderedgepro"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-555-TRADER",
        "contactType": "customer service",
        "email": "support@traderedgepro.com",
        "availableLanguage": "English"
      },
      "areaServed": "Worldwide",
      "serviceType": "Prop Firm Clearing Service"
    });

    // Software Application Schema
    updateJsonLdScript('software-app-schema', {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Nexus AI Coach",
      "description": "Advanced AI-powered trading coach with real-time signals and risk management.",
      "url": "https://traderedgepro.com/ai-coach",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "49.50",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1847",
        "bestRating": "5",
        "worstRating": "1"
      },
      "creator": {
        "@type": "Organization",
        "name": "TraderEdge Pro"
      }
    });

    // FAQ Schema
    updateJsonLdScript('faq-schema', {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a prop firm challenge?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A prop firm challenge is an evaluation phase where traders prove their skills by trading with the firm's capital under specific rules and targets. Successful completion grants access to funded trading accounts."
          }
        },
        {
          "@type": "Question",
          "name": "How does TraderEdge Pro help with challenges?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We provide AI-powered signals, risk management tools, position sizing calculators, and expert guidance to help traders clear challenges with a 94% success rate."
          }
        },
        {
          "@type": "Question",
          "name": "What makes your signals different?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our Nexus AI analyzes multiple timeframes, market sentiment, and institutional positioning to generate signals with 85%+ accuracy, including detailed reasoning for each trade setup."
          }
        },
        {
          "@type": "Question",
          "name": "Do you guarantee profits?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No, we do not guarantee profits. Trading involves substantial risk and past performance does not guarantee future results. Our tools and education are designed to maximize your chances of success."
          }
        },
        {
          "@type": "Question",
          "name": "Which prop firms do you support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We support all major prop firms including FTMO, MyForexFunds, The5ers, and many others. Our tools work with any MetaTrader 4/5 compatible broker."
          }
        }
      ]
    });

  }, [fullTitle, description, keywords, image, currentUrl, type, publishedTime, modifiedTime, author, section, tags]);

  return null; // This component doesn't render anything visible
};

// Dynamic Metadata Hook for Signals
export const useSignalSEO = (signalId?: string) => {
  // This would fetch signal data from API
  const signalData = {
    pair: 'EUR/USD',
    direction: 'SHORT',
    confidence: 87,
    description: `AI-powered ${'EUR/USD'} SHORT signal with ${87}% confidence. Professional analysis for optimal risk-reward ratio.`
  };

  return {
    title: `${signalData.pair} ${signalData.direction} Signal - ${signalData.confidence}% Confidence | TraderEdge Pro`,
    description: signalData.description,
    keywords: [signalData.pair, 'trading signal', 'AI analysis', 'forex signal', 'prop firm challenge']
  };
};

// Dynamic Metadata Hook for Prop Firms
export const useFirmSEO = (firmId?: string) => {
  // This would fetch firm data from API
  const firmData = {
    name: 'FTMO',
    successRate: 87.5,
    description: `FTMO prop firm challenge clearing service. ${87.5}% success rate with professional guidance and AI-powered signals.`
  };

  return {
    title: `${firmData.name} Challenge Clearing Service - ${firmData.successRate}% Success Rate | TraderEdge Pro`,
    description: firmData.description,
    keywords: [firmData.name, 'prop firm', 'challenge clearing', 'funded account', 'trading evaluation']
  };
};
