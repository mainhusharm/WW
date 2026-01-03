import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Zap,
  Crown,
  Star,
  ArrowRight,
  Sparkles,
  Shield,
  Rocket,
  Brain,
  Users,
  Globe,
  AlertCircle
} from 'lucide-react';

// Types for better type safety and component reusability
interface PricingTier {
  name: string;
  subtitle: string;
  price: { monthly: number; yearly: number };
  description: string;
  icon: typeof Zap;
  gradient: string;
  borderGradient: string;
  features: string[];
  highlight: boolean;
  badge: string | null;
  ariaLabel?: string;
}

interface AdditionalFeature {
  icon: typeof Brain;
  title: string;
  description: string;
}

interface PremiumPricingProps {
  /** Custom pricing tiers to override defaults */
  customTiers?: PricingTier[];
  /** Custom additional features */
  customFeatures?: AdditionalFeature[];
  /** Callback when a plan is selected */
  onPlanSelect?: (planName: string, isYearly: boolean) => void;
  /** Custom CTA text */
  ctaText?: string;
  /** Show/hide additional features section */
  showAdditionalFeatures?: boolean;
  /** Show/hide FAQ/CTA section */
  showCTASection?: boolean;
  /** Custom discount percentage for yearly plans */
  yearlyDiscountPercent?: number;
  /** Component variant for different layouts */
  variant?: 'default' | 'compact' | 'minimal' | 'enterprise';
  /** Color theme variant */
  colorTheme?: 'default' | 'warm' | 'cool' | 'monochrome';
}

const pricingPlans = [
  {
    name: "Starter",
    subtitle: "Perfect for individuals",
    price: { monthly: 29, yearly: 290 },
    description: "Get started with AI-powered productivity tools",
    icon: Zap,
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderGradient: "from-blue-400 to-cyan-400",
    features: [
      "5 AI projects per month",
      "Basic AI models access",
      "Email support",
      "Standard templates",
      "1GB cloud storage",
      "Basic analytics"
    ],
    highlight: false,
    badge: null
  },
  {
    name: "Professional",
    subtitle: "Most popular choice",
    price: { monthly: 99, yearly: 990 },
    description: "Advanced AI capabilities for growing teams",
    icon: Crown,
    gradient: "from-indigo-500/20 to-purple-500/20",
    borderGradient: "from-indigo-400 to-purple-400",
    features: [
      "Unlimited AI projects",
      "Premium AI models",
      "Priority support",
      "Custom templates",
      "100GB cloud storage",
      "Advanced analytics",
      "Team collaboration",
      "API access"
    ],
    highlight: true,
    badge: "Most Popular"
  },
  {
    name: "Enterprise",
    subtitle: "For large organizations",
    price: { monthly: 299, yearly: 2990 },
    description: "Enterprise-grade AI solutions with full control",
    icon: Rocket,
    gradient: "from-rose-500/20 to-pink-500/20",
    borderGradient: "from-rose-400 to-pink-400",
    features: [
      "Everything in Professional",
      "Custom AI model training",
      "24/7 dedicated support",
      "Unlimited cloud storage",
      "Advanced security",
      "Custom integrations",
      "SLA guarantee",
      "White-label options"
    ],
    highlight: false,
    badge: "Enterprise"
  }
];

const additionalFeatures = [
  {
    icon: Brain,
    title: "Advanced AI Models",
    description: "Access to GPT-4, Claude, and custom models"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption"
  },
  {
    icon: Globe,
    title: "Global Infrastructure",
    description: "99.9% uptime with worldwide data centers"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time collaboration with unlimited teammates"
  }
];

export function PremiumPricing({
  customTiers,
  customFeatures,
  onPlanSelect,
  ctaText = "Get Started",
  showAdditionalFeatures = true,
  showCTASection = true,
  yearlyDiscountPercent = 20,
  variant = 'default',
  colorTheme = 'default'
}: PremiumPricingProps = {}) {
  const [isYearly, setIsYearly] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize validation results to prevent unnecessary re-calculations
  const validationResult = useMemo(() => {
    let tiers = pricingPlans;
    let features = additionalFeatures;
    let hasError = false;
    let errorMessage = '';

    try {
      if (customTiers) {
        const invalidTiers = customTiers.filter(tier => !validatePricingTier(tier));
        if (invalidTiers.length > 0) {
          hasError = true;
          errorMessage = 'Invalid pricing tiers provided. Please check the tier configuration.';
        } else {
          tiers = customTiers;
        }
      }

      if (customFeatures && !hasError) {
        const invalidFeatures = customFeatures.filter(feature => !validateAdditionalFeature(feature));
        if (invalidFeatures.length > 0) {
          hasError = true;
          errorMessage = 'Invalid additional features provided. Please check the feature configuration.';
        } else {
          features = customFeatures;
        }
      }

      // Validate yearlyDiscountPercent
      if (yearlyDiscountPercent < 0 || yearlyDiscountPercent > 100) {
        hasError = true;
        errorMessage = `Yearly discount percent must be between 0 and 100. Received: ${yearlyDiscountPercent}`;
      }
    } catch (err) {
      hasError = true;
      errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    }

    return { tiers, features, hasError, errorMessage };
  }, [customTiers, customFeatures, yearlyDiscountPercent]);

  const { tiers, features, hasError, errorMessage } = validationResult;

  // Variant configurations
  const variantConfig = {
    default: {
      padding: "py-32",
      cardSpacing: "gap-8",
      headerSize: "text-4xl sm:text-6xl md:text-7xl",
      showParticles: true,
      showAnimations: true
    },
    compact: {
      padding: "py-16",
      cardSpacing: "gap-6",
      headerSize: "text-3xl sm:text-4xl md:text-5xl",
      showParticles: false,
      showAnimations: true
    },
    minimal: {
      padding: "py-12",
      cardSpacing: "gap-4",
      headerSize: "text-2xl sm:text-3xl md:text-4xl",
      showParticles: false,
      showAnimations: false
    },
    enterprise: {
      padding: "py-40",
      cardSpacing: "gap-10",
      headerSize: "text-5xl sm:text-7xl md:text-8xl",
      showParticles: true,
      showAnimations: true
    }
  };

  // Color theme configurations
  const themeConfig = {
    default: {
      background: "from-black via-indigo-950/20 to-black",
      gradientAccent: "from-indigo-500/[0.08] via-purple-500/[0.05] to-rose-500/[0.08]",
      primaryColor: "indigo",
      accentColor: "purple"
    },
    warm: {
      background: "from-orange-950 via-red-950/20 to-yellow-950",
      gradientAccent: "from-orange-500/[0.08] via-red-500/[0.05] to-yellow-500/[0.08]",
      primaryColor: "orange",
      accentColor: "red"
    },
    cool: {
      background: "from-blue-950 via-cyan-950/20 to-teal-950",
      gradientAccent: "from-blue-500/[0.08] via-cyan-500/[0.05] to-teal-500/[0.08]",
      primaryColor: "blue",
      accentColor: "cyan"
    },
    monochrome: {
      background: "from-gray-950 via-slate-950/20 to-zinc-950",
      gradientAccent: "from-gray-500/[0.08] via-slate-500/[0.05] to-zinc-500/[0.08]",
      primaryColor: "gray",
      accentColor: "slate"
    }
  };

  const currentVariant = variantConfig[variant];
  const currentTheme = themeConfig[colorTheme];

  // Handle plan selection with error handling
  const handlePlanSelect = (planName: string) => {
    try {
      onPlanSelect?.(planName, isYearly);
    } catch (err) {
      console.error('Error in plan selection callback:', err);
    }
  };

  // Calculate savings for yearly billing with validation
  const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    if (typeof monthlyPrice !== 'number' || typeof yearlyPrice !== 'number') {
      return 0;
    }
    return Math.max(0, (monthlyPrice * 12) - yearlyPrice);
  };

  // Show error state if there's an error
  if (hasError) {
    return <ErrorFallback error={new Error(errorMessage)} resetErrorBoundary={() => window.location.reload()} />;
  }

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.23, 0.86, 0.39, 0.96]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className={`relative ${currentVariant.padding} bg-gradient-to-br ${currentTheme.background} text-white overflow-hidden`}>
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient mesh */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradientAccent}`}
          animate={currentVariant.showAnimations ? {
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          } : {}}
          transition={currentVariant.showAnimations ? {
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          } : {}}
          style={{
            backgroundSize: '400% 400%'
          }}
        />

        {/* Moving orbs */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 150, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-64 h-64 bg-rose-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -120, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating particles */}
        {currentVariant.showParticles && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 1, 0.2],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        ref={containerRef}
        className="relative z-10 max-w-7xl mx-auto px-6"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          variants={fadeInUp}
        >
          <motion.div
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.08] border border-white/[0.15] backdrop-blur-sm mb-6"
            whileHover={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.3)" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-indigo-300" />
            </motion.div>
            <span className="text-sm font-medium text-white/80">
              ✨ Premium AI Plans
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </motion.div>

          <motion.h2
            className={`${currentVariant.headerSize} font-bold mb-8 tracking-tight`}
            variants={fadeInUp}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Choose Your
            </span>
            <br />
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-rose-300"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                backgroundSize: '200% 200%'
              }}
            >
              AI Journey
            </motion.span>
          </motion.h2>

          <motion.p
            className="text-xl sm:text-2xl text-white/60 max-w-4xl mx-auto leading-relaxed mb-12"
            variants={fadeInUp}
          >
            Unlock the full potential of AI with our premium plans designed for every stage of your journey.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            className="flex items-center justify-center gap-4"
            variants={fadeInUp}
          >
            <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-white/60'}`}>
              Monthly
            </span>

            <motion.button
              onClick={() => setIsYearly(!isYearly)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsYearly(!isYearly);
                }
              }}
              className={`relative w-16 h-8 rounded-full border-2 transition-all ${
                isYearly ? 'bg-indigo-500 border-indigo-400' : 'bg-white/[0.08] border-white/[0.15]'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Switch to ${isYearly ? 'monthly' : 'yearly'} billing`}
              aria-pressed={isYearly}
              role="switch"
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{
                  x: isYearly ? 32 : 2
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            </motion.button>

            <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-white/60'}`}>
              Yearly
            </span>

            {isYearly && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-xs text-green-300"
              >
                Save {yearlyDiscountPercent}%
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className={`grid grid-cols-1 md:grid-cols-3 ${currentVariant.cardSpacing} mb-20`}
          variants={staggerContainer}
        >
          {tiers.map((plan, index) => (
            <motion.div
              key={plan.name}
              className="relative"
              variants={fadeInUp}
              onHoverStart={() => setHoveredPlan(index)}
              onHoverEnd={() => setHoveredPlan(null)}
            >

              <motion.div
                className={`relative h-full p-8 rounded-3xl border backdrop-blur-xl overflow-hidden ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-white/[0.12] to-white/[0.04] border-indigo-400/50'
                    : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/[0.15]'
                }`}
                variants={currentVariant.showAnimations ? cardHover : {}}
                initial="rest"
                whileHover={currentVariant.showAnimations ? "hover" : undefined}
                style={{
                  boxShadow: plan.highlight
                    ? "0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, 0.2)"
                    : "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <motion.div
                    className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${plan.borderGradient} text-white`}
                    initial={{ y: -200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {plan.badge}
                  </motion.div>
                )}

                {/* Enhanced gradient overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-3xl opacity-60`}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '300% 300%'
                  }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} border border-white/20 flex items-center justify-center mb-6`}
                    whileHover={{ scale: 1.1, rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                  >
                    <plan.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Plan Info */}
                  <h3 className="text-2xl font-bold pricing-text-primary mb-2">{plan.name}</h3>
                  <p className="pricing-text-secondary text-sm mb-4">{plan.subtitle}</p>
                  <p className="pricing-text-muted mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold pricing-text-primary">
                        ${isYearly ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="pricing-text-secondary">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    {isYearly && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pricing-success text-sm mt-1"
                      >
                        Save ${calculateYearlySavings(plan.price.monthly, plan.price.yearly)} per year
                      </motion.p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <span className="sr-only">{plan.name} plan features:</span>
                    {plan.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        className="flex items-center gap-3 py-1.5"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: featureIndex * 0.1 }}
                      >

                        <div
                          className="w-5 h-5 rounded-full pricing-success-bg border pricing-success-border flex items-center justify-center flex-shrink-0"
                          aria-hidden="true"
                        >
                          <Check className="w-3 h-3 pricing-success" />
                        </div>
                        <span className="pricing-text-muted text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    onClick={() => handlePlanSelect(plan.name)}
                    className={`w-full py-4 px-6 rounded-xl font-medium transition-all ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 pricing-text-primary'
                        : 'pricing-card-bg border pricing-card-border pricing-text-primary hover:bg-white/[0.12] hover:border-white/[0.25]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={`Select ${plan.name} plan - ${isYearly ? plan.price.yearly : plan.price.monthly} dollars per ${isYearly ? 'year' : 'month'}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {ctaText}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </motion.button>
                </div>

                {/* Hover glow effect */}
                <AnimatePresence>
                  {hoveredPlan === index && (
                    <motion.div
                      className="absolute inset-0 rounded-3xl"
                      style={{
                        background: `linear-gradient(135deg, ${plan.borderGradient.replace('from-', 'rgba(').replace(' to-', ', 0.2) 0%, rgba(').replace('-', ', ')}, 0.1) 100%)`,
                        filter: 'blur(20px)',
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features */}
        {showAdditionalFeatures && (
          <motion.div
            className="mb-20"
            variants={fadeInUp}
          >

            <h3 className="text-3xl font-bold text-center pricing-text-primary mb-12">
              What Makes Our Platform Special
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="p-6 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.15] text-center group hover:bg-white/[0.08] transition-all"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center mx-auto mb-4"
                    whileHover={{ rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-6 h-6 text-indigo-300" />
                  </motion.div>

                  <h4 className="text-lg font-semibold pricing-text-primary mb-2">{feature.title}</h4>
                  <p className="pricing-text-secondary text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        {showCTASection && (
          <motion.div
            className="text-center"
            variants={fadeInUp}
          >
            <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.15] p-8 md:p-12 overflow-hidden group max-w-4xl mx-auto">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.05] to-rose-500/[0.08] rounded-3xl"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '300% 300%'
                }}
              />

              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-rose-200 bg-clip-text text-transparent">
                    Ready to Transform Your Business?
                  </span>
                </h3>
                <p className="text-xl text-white/70 mb-8 leading-relaxed">
                  Join thousands of businesses already using our AI platform to revolutionize their operations.
                  Start your free trial today.
                </p>

                <motion.button
                  className="relative group overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-4 px-8 rounded-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Star className="h-5 w-5" />
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

// Prop validation helpers
const validatePricingTier = (tier: PricingTier): boolean => {
  return (
    typeof tier.name === 'string' &&
    typeof tier.subtitle === 'string' &&
    typeof tier.price === 'object' &&
    typeof tier.price.monthly === 'number' &&
    typeof tier.price.yearly === 'number' &&
    tier.price.monthly >= 0 && // Allow free plans (price = 0)
    tier.price.yearly >= 0 &&  // Allow free plans (price = 0)
    typeof tier.description === 'string' &&
    Array.isArray(tier.features) &&
    tier.features.length > 0
  );
};

const validateAdditionalFeature = (feature: AdditionalFeature): boolean => {
  return (
    typeof feature.title === 'string' &&
    typeof feature.description === 'string' &&
    typeof feature.icon === 'function'
  );
};

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
      Something went wrong
    </h3>
    <p className="text-red-600 dark:text-red-400 text-center mb-4">
      {error.message}
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
      Try again
    </button>
  </div>
);
