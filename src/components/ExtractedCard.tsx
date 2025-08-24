import React from 'react';
import { CheckCircle } from 'lucide-react';

// These are placeholder components. You will need to replace them with your actual 3D components.
const Card3D = ({ children, className, glowColor }: { children: React.ReactNode, className?: string, glowColor?: string }) => (
  <div className={`border rounded-lg p-8 ${className}`} style={{ borderColor: glowColor }}>
    {children}
  </div>
);

const HolographicText = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h2 className={className}>{children}</h2>
);

const Button3D = ({ children, onClick, variant, size }: { children: React.ReactNode, onClick: () => void, variant?: string, size?: string }) => {
  const baseStyle = "px-6 py-3 rounded-lg font-bold text-white";
  const variantStyle = variant === 'primary' 
    ? "bg-blue-500 hover:bg-blue-600" 
    : "bg-gray-500 hover:bg-gray-600";
  return (
    <button onClick={onClick} className={`${baseStyle} ${variantStyle}`}>
      {children}
    </button>
  );
};

const ScrollReveal = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;


const ExtractedCard: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <Card3D className="p-12 holographic" glowColor="cyan">
            <HolographicText className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Clear Your <span className="text-blue-400">Prop Firm Challenge</span>?
            </HolographicText>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of successful traders who achieved funded account status with our proven methodology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Button3D
                onClick={() => window.location.href = '/membership'}
                variant="primary"
                size="lg"
              >
                Start Your Journey
              </Button3D>
              <Button3D
                onClick={() => window.location.href = '/membership'}
                variant="secondary"
                size="lg"
              >
                View Pricing
              </Button3D>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Custom Trading Plans</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Expert Support</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Professional Support</span>
              </div>
            </div>
          </Card3D>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ExtractedCard;
