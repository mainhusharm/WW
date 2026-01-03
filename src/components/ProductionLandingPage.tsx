import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import ReactLenis from 'lenis/react';
import {
  Shield,
  Target,
  Users,
  BarChart3,
  Star,
  ArrowRight,
  Award,
  Zap,
  TrendingUp,
  Circle
} from 'lucide-react';
import Header from './Header';
import MT5BotPortal from './MT5BotPortal';
import CombinedMembershipPlans from './CombinedMembershipPlans';
import InfiniteHero from './ui/infinite-hero';
import { GradientTracing } from './ui/gradient-tracing';
import { ElegantShape } from './ui/shape-landing-hero';
import { PremiumTestimonials } from './ui/premium-testimonials';
import ShaderBackground from './ui/shader-background';
import { Component as TypewriterTestimonial } from './ui/typewriter-testimonial';
import { ReviewSummaryCard } from './ui/card-2';
import FUITestimonialWithSlide from './ui/sliding-testimonial';
import { Component as ImageAutoSlider } from './ui/image-auto-slider';
import {
  VideoModal,
  VideoModalTrigger,
  VideoModalContent,
  VideoModalTitle,
  VideoModalDescription,
  VideoModalVideo,
  VideoPreview,
  VideoPlayButton,
  VideoPlayer,
  CloseIcon,
} from './ui/video-modal';
import { Button } from './ui/button';
import { Play } from 'lucide-react';
import SEOWrapper from './SEOWrapper';
import { Component as EtheralShadow } from './ui/etheral-shadow';

// Import new landing page sections
import PropFirmRuleTracker from './PropFirmRuleTracker';
import CompatiblePropFirms from './CompatiblePropFirms';
import NexusAIReasoningDemo from './NexusAIReasoningDemo';
import FundingPathSteps from './FundingPathSteps';
import EnhancedComparisonTable from './EnhancedComparisonTable';
import ComprehensiveFAQ from './ComprehensiveFAQ';
import TradersEdgeBlog from './TradersEdgeBlog';
import FloatingConversionHub from './FloatingConversionHub';

import { cn } from '../lib/utils';

const ProductionLandingPage = () => {

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      color: "blue",
      title: "Risk Management Protocols",
      description: "Stop Blowing Accounts: Automatic Risk Guards prevent catastrophic losses and protect your capital.",
    },
    {
      icon: <Target className="w-6 h-6" />,
      color: "green",
      title: "Precision Entry Signals",
      description: "Never Miss Opportunities: AI-powered entry signals with 85%+ accuracy for optimal trade timing.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      color: "purple",
      title: "24/7 Nexus Coach",
      description: "Overcome Trading Isolation: Get instant guidance and emotional support when markets are volatile.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      color: "yellow",
      title: "Real-Time Risk Audits",
      description: "Stop Blind Trading: Live risk monitoring catches dangerous positions before they destroy your account.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      color: "cyan",
      title: "Automated Trade Execution",
      description: "Eliminate Human Error: Perfect execution timing with zero emotional interference or hesitation.",
    },
    {
      icon: <Award className="w-6 h-6" />,
      color: "orange",
      title: "Challenge Clearing System",
      description: "End Failed Attempts: Structured approach that turns 70% failure rates into 94% success rates.",
    }
  ];

  const stats = [
    { number: "2,847+", label: "Successful Traders" },
    { number: "94%", label: "Success Rate" },
    { number: "$50M+", label: "Total Profits" },
    { number: "24/7", label: "Support Available" }
  ];

  const testimonials = [
    {
      author: "Sarah Chen",
      role: "Prop Trader",
      content: "The guidance and support I received was incredible. I cleared my challenge in just 3 weeks!",
      rating: 5,
      profit: "+$12,500"
    },
    {
      author: "Marcus Johnson",
      role: "Day Trader",
      content: "The analytics platform is game-changing. I can see exactly where I need to improve.",
      rating: 5,
      profit: "+$8,900"
    },
    {
      author: "Elena Rodriguez",
      role: "Swing Trader",
      content: "The community support and expert guidance made all the difference in my trading journey.",
      rating: 5,
      profit: "+$15,200"
    }
  ];

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const membershipRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // State for earnings projection slider
  const [accountSize, setAccountSize] = useState<number>(10000);

  // State for exit-intent popup
  const [showExitPopup, setShowExitPopup] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');

  // Exit-intent popup logic
  useEffect(() => {
    let mouseY = 0;
    let hasShownPopup = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseY = e.clientY;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShownPopup && mouseY > 50) {
        // User moved mouse to top of screen (exit intent)
        setShowExitPopup(true);
        hasShownPopup = true;
      }
    };

    // Only add listeners if not on mobile
    if (window.innerWidth > 768) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      // Send email to backend
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('Thank you! Check your email for the free Prop Firm Risk Management Calculator.');
        setShowExitPopup(false);
        setEmail('');
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  // Scroll progress hooks for revealing animations - OPTIMIZED FOR FASTER REVEAL
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start 80%", "end 20%"]
  });

  const { scrollYProgress: featuresProgress } = useScroll({
    target: featuresRef,
    offset: ["start 80%", "end 20%"]
  });

  const { scrollYProgress: parallaxProgress } = useScroll({
    target: parallaxRef,
    offset: ["start 80%", "end 20%"]
  });

  const { scrollYProgress: successProgress } = useScroll({
    target: successRef,
    offset: ["start 80%", "end 20%"]
  });

  const { scrollYProgress: membershipProgress } = useScroll({
    target: membershipRef,
    offset: ["start 80%", "end 20%"]
  });

  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ["start 80%", "end 20%"]
  });

  // Transform values for revealing animations - OPTIMIZED FOR FASTER REVEAL
  const heroY = useTransform(heroProgress, [0, 1], [100, 0]);
  const heroOpacity = useTransform(heroProgress, [0, 0.2, 1], [0, 0.8, 1]);

  const featuresY = useTransform(featuresProgress, [0, 1], [100, 0]);
  const featuresOpacity = useTransform(featuresProgress, [0, 0.2, 1], [0, 0.8, 1]);
  const featuresGlow = useTransform(featuresProgress, [0, 0.3, 0.7, 1], [0, 35, 35, 0]);
  const featuresBoxShadow = useTransform(featuresGlow, (val) => `0 0 ${val}px rgba(6, 182, 212, ${val / 35})`);

  const parallaxY = useTransform(parallaxProgress, [0, 1], [100, 0]);
  const parallaxOpacity = useTransform(parallaxProgress, [0, 0.2, 1], [0, 0.8, 1]);
  const parallaxGlow = useTransform(parallaxProgress, [0, 0.3, 0.7, 1], [0, 35, 35, 0]);

  const successY = useTransform(successProgress, [0, 1], [100, 0]);
  const successOpacity = useTransform(successProgress, [0, 0.2, 1], [0, 0.8, 1]);
  const successGlow = useTransform(successProgress, [0, 0.3, 0.7, 1], [0, 35, 35, 0]);

  const membershipY = useTransform(membershipProgress, [0, 1], [100, 0]);
  const membershipOpacity = useTransform(membershipProgress, [0, 0.2, 1], [0, 0.8, 1]);
  const membershipGlow = useTransform(membershipProgress, [0, 0.3, 0.7, 1], [0, 35, 35, 0]);

  const ctaY = useTransform(ctaProgress, [0, 1], [100, 0]);
  const ctaOpacity = useTransform(ctaProgress, [0, 0.2, 1], [0, 0.8, 1]);
  const ctaGlow = useTransform(ctaProgress, [0, 0.3, 0.7, 1], [0, 35, 35, 0]);

  return (
    <SEOWrapper
      pageType="home"
      customTitle="TraderEdge Pro - Clear Your Prop Firm Challenge with AI-Powered Precision"
      customDescription="Professional prop firm clearing service with AI-powered signals, risk management, and 94% success rate. Join 2,847+ successful traders who cleared their challenges."
      customKeywords={[
        "prop firm challenge",
        "funded trading account",
        "trading signals",
        "risk management",
        "AI trading coach",
        "forex signals",
        "crypto trading",
        "trading journal",
        "position sizing calculator",
        "trading education",
        "FTMO challenge",
        "MyForexFunds evaluation",
        "trading prop firm",
        "funded trader",
        "trading strategy",
        "market analysis",
        "technical analysis",
        "trading psychology",
        "risk reward ratio",
        "trading discipline"
      ]}
    >
      {/* Etheral Shadows Background - Full page behind everything */}
      <EtheralShadow
        color="rgba(139, 92, 246, 0.6)"
        animation={{ scale: 60, speed: 5 }}
        noise={{ opacity: 0.6, scale: 1.8 }}
        sizing="fill"
        className="fixed top-0 left-0 w-full h-screen z-0"
        style={{ margin: 0, padding: 0 }}
      />

      <div>
        {/* 🚀 Hero Section (FUIHeroWithJelly): The Hook - AI + Hyperspeed background */}
        <motion.section
          ref={heroRef}
          className="relative min-h-screen flex items-start -mt-32"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <InfiniteHero />
        </motion.section>

        <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative pt-20">

      {/* Global Geometric Shapes - Hidden on mobile to prevent overflow */}
      <div className="fixed inset-0 pointer-events-none hidden md:block z-10">
        <ElegantShape
          delay={0.3}
          width={500}
          height={120}
          rotate={12}
          gradient="from-cyan-500/[0.12]"
          className="left-[5%] top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={400}
          height={100}
          rotate={-15}
          gradient="from-blue-500/[0.12]"
          className="right-[5%] top-[70%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-indigo-500/[0.12]"
          className="left-[10%] bottom-[10%]"
        />
      </div>

      <Header />

      {/* 🏢 Compatible Prop Firms: Authority - Logos of supported firms like FTMO, Funding Pips */}
      <CompatiblePropFirms />

      {/* ⚡ Professional-Grade Features: The Solution - 6-card grid explaining the "What" */}
      <motion.section
        ref={featuresRef}
        className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden"
        style={{
          y: featuresY,
          opacity: featuresOpacity,
          boxShadow: featuresBoxShadow
        }}
      >
        {/* Elegant Shape Background */}
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.1}
            width={350}
            height={90}
            rotate={8}
            gradient="from-indigo-500/[0.06]"
            className="left-[-8%] top-[10%]"
          />
          <ElegantShape
            delay={0.3}
            width={280}
            height={70}
            rotate={-12}
            gradient="from-rose-500/[0.06]"
            className="right-[-6%] top-[60%]"
          />
          <ElegantShape
            delay={0.5}
            width={200}
            height={50}
            rotate={18}
            gradient="from-violet-500/[0.06]"
            className="left-[10%] bottom-[20%]"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Professional-Grade{" "}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                Features
              </span>
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto font-light">
              Everything you need to successfully clear prop firm challenges and manage funded accounts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const colorClasses = {
                blue: {
                  icon: "text-blue-400/80 group-hover:text-blue-400",
                  glow: "group-hover:shadow-blue-500/25"
                },
                green: {
                  icon: "text-green-400/80 group-hover:text-green-400",
                  glow: "group-hover:shadow-green-500/25"
                },
                purple: {
                  icon: "text-purple-400/80 group-hover:text-purple-400",
                  glow: "group-hover:shadow-purple-500/25"
                },
                yellow: {
                  icon: "text-yellow-400/80 group-hover:text-yellow-400",
                  glow: "group-hover:shadow-yellow-500/25"
                },
                cyan: {
                  icon: "text-cyan-400/80 group-hover:text-cyan-400",
                  glow: "group-hover:shadow-cyan-500/25"
                },
                orange: {
                  icon: "text-orange-400/80 group-hover:text-orange-400",
                  glow: "group-hover:shadow-orange-500/25"
                }
              };

              const colorClass = colorClasses[feature.color as keyof typeof colorClasses] || colorClasses.cyan;

              return (
                <motion.div
                  key={index}
                  className={`group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-2xl ${colorClass.glow} transition-all duration-500 hover:scale-105 hover:-translate-y-2`}
                  whileHover={{ rotateY: 5, rotateX: 5 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className={`mb-6 ${colorClass.icon} transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white/90 mb-3 group-hover:text-white transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-white/40 leading-relaxed font-light group-hover:text-white/50 transition-colors duration-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Combined Membership Plans - MOVED UP for fast-conversion strategy */}
      <motion.div
        ref={membershipRef}
        style={{ y: membershipY, opacity: membershipOpacity }}
      >
        <CombinedMembershipPlans showHeader={false} />
      </motion.div>

      {/* Primary CTA - MOVED UP for fast-conversion strategy */}
      <motion.section
        ref={ctaRef}
        className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden"
        style={{ y: ctaY, opacity: ctaOpacity }}
      >
        {/* Elegant Shape Background */}
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.1}
            width={380}
            height={95}
            rotate={25}
            gradient="from-teal-500/[0.04]"
            className="left-[-9%] top-[25%]"
          />
          <ElegantShape
            delay={0.3}
            width={240}
            height={60}
            rotate={-20}
            gradient="from-orange-500/[0.04]"
            className="right-[-5%] bottom-[35%]"
          />
          <ElegantShape
            delay={0.5}
            width={160}
            height={40}
            rotate={15}
            gradient="from-purple-500/[0.04]"
            className="left-[25%] top-[60%]"
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="p-16 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Ready to Clear Your{" "}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                Challenge?
              </span>
            </h2>
            <p className="text-lg text-white/40 mb-8 font-light">
              Join thousands of successful traders and start your journey to financial freedom today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
              >
                Start Your Challenge
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/prop-comparison"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-full hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105"
              >
                Compare Prop Firms
                <TrendingUp className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/mt5-development"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-purple-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
              >
                Custom Automation
                <Zap className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 🧮 Prop Firm Rule Tracker: Value - The free interactive tool to calculate lot sizes */}
      <PropFirmRuleTracker />

      {/* 🤖 Nexus AI Reasoning Demo: Logic - Visual proof of how the AI thinks */}
      <NexusAIReasoningDemo />

      {/* 📡 Signal Feed Section: Live Data - Real-time signals and execution stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-blue-500/[0.02]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Live Signal Feed &{" "}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">
                AI Logic
              </span>
            </h2>
            <p className="text-xl text-white/40 max-w-3xl mx-auto font-light">
              See exactly how our AI analyzes markets and generates precise trading signals with complete transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Signal Feed Preview */}
            <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Live Signal Feed</h3>

              {/* Mock Signal Card */}
              <div className="bg-[#1a1a1a] border border-white/[0.1] rounded-2xl p-6 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-lg font-semibold text-white">EUR/USD SHORT</div>
                    <div className="text-sm text-white/60">Confidence: 87%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">SHORT</div>
                    <div className="text-xs text-white/40">2 mins ago</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">Entry</div>
                    <div className="text-white font-semibold">1.0845</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">Stop Loss</div>
                    <div className="text-white font-semibold">1.0875</div>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                  Nexus AI Logic
                </button>
              </div>

              {/* AI Logic Reveal (would be shown on click) */}
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-3">AI Reasoning</h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  "EUR/USD shows bearish divergence on 4H MACD while RSI indicates overbought conditions. Previous resistance at 1.0875 now acting as strong support. Market sentiment analysis reveals 68% bearish positioning among institutional traders. Entry timed for optimal risk-reward ratio of 1:2.5."
                </p>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Real-Time Analysis</h4>
                  <p className="text-white/60">Every signal includes detailed market analysis and confidence scoring.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Risk Management</h4>
                  <p className="text-white/60">Automatic stop-loss calculations and position sizing for every trade.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Instant Execution</h4>
                  <p className="text-white/60">Signals designed for immediate action with clear entry and exit points.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 3-Step Funding Path: Clarity - Timeline of the user journey */}
      <FundingPathSteps />

      {/* 🎥 AI Video Section: Visual Proof - Video demo + technical stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        {/* Cool Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] via-purple-500/[0.01] to-blue-500/[0.02]" />

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-pulse" style={{ animationDuration: '6s' }} />
        </div>

        {/* Floating Tech Elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-cyan-400/10 rotate-45 animate-float" style={{ animationDelay: '0s', animationDuration: '12s' }}>
          <div className="absolute inset-1 border border-cyan-400/5" />
        </div>
        <div className="absolute top-3/4 right-1/4 w-12 h-12 border border-purple-400/10 rounded-full animate-float" style={{ animationDelay: '3s', animationDuration: '15s' }}>
          <div className="absolute inset-1 border border-purple-400/5 rounded-full" />
        </div>
        <div className="absolute top-1/2 right-1/3 w-8 h-8 border border-blue-400/10 rotate-12 animate-float" style={{ animationDelay: '6s', animationDuration: '10s' }}>
          <div className="absolute inset-0.5 border border-blue-400/5 rotate-45" />
        </div>

        {/* Subtle Glow Orbs */}
        <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-gradient-radial from-cyan-500/3 via-transparent to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gradient-radial from-purple-500/3 via-transparent to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                See Our AI Trading{" "}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                Technology in Action
              </span>
            </h2>
            <p className="text-xl text-white/40 max-w-3xl mx-auto font-light mb-12">
              Watch how our advanced AI-powered platform analyzes markets, identifies opportunities, and executes trades with precision and speed unmatched by traditional trading methods.
            </p>
          </div>

          <div className="relative justify-center">
            <VideoModal>
              <VideoModalTrigger>
                <Button
                  variant="outline"
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-400/50 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch AI Trading Demo
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              </VideoModalTrigger>
              <VideoModalContent>
                <VideoModalTitle className="text-center">AI-Powered Trading Technology</VideoModalTitle>
                <VideoModalDescription className="text-center">
                  Experience the future of algorithmic trading with our advanced AI systems that analyze multiple timeframes, identify high-probability setups, and execute trades with institutional-grade precision.
                </VideoModalDescription>
                <VideoModalVideo>
                  <VideoPlayer>
                    <VideoPreview>
                      <img
                        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&crop=center"
                        alt="AI Trading Technology Preview"
                        className="w-full h-full object-cover"
                      />
                    </VideoPreview>
                    <VideoPlayButton>
                      <button className="absolute inset-0 m-auto flex size-32 items-center justify-center rounded-full border border-white border-white/10 bg-white/50 transition duration-300 hover:bg-white/75">
                        <Play className="size-20 stroke-1 text-white" />
                      </button>
                    </VideoPlayButton>
                    <video
                      className="size-full"
                      controls
                      poster="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&crop=center"
                      preload="metadata"
                    >
                      <source src="https://raw.githubusercontent.com/anchalw11/photos/main/Trade%20with%20ai.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </VideoPlayer>
                </VideoModalVideo>
              </VideoModalContent>
            </VideoModal>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-white/60">Automated Trading</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">99.9%</div>
              <div className="text-white/60">Execution Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">0.01s</div>
              <div className="text-white/60">Average Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* ⚖️ Enhanced Comparison Table: Competitive Edge - Why you beat manual trading */}
      <EnhancedComparisonTable />

      {/* 💰 Earnings Calculator: The Reward - Interactive profit projections */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] via-transparent to-cyan-500/[0.02]" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Calculate Your{" "}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-cyan-300">
                Potential Profits
              </span>
            </h2>
            <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
              See how much you could earn with our AI-powered trading system. Adjust your account size and view projected profits at different win rates.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl p-8 md:p-12">
            {/* Account Size Slider */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-semibold text-white/90">Account Size</label>
                <span className="text-2xl font-bold text-cyan-400">${accountSize.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="200000"
                step="5000"
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-white/40 mt-2">
                <span>$10K</span>
                <span>$200K</span>
              </div>
            </div>

            {/* Profit Projections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[60, 70, 80].map((winRate) => {
                const riskRewardRatio = 2; // 1:2 Risk/Reward
                const totalTrades = Math.floor(accountSize / 1000); // Assuming $10 per trade setup
                const winningTrades = Math.floor(totalTrades * (winRate / 100));
                const losingTrades = totalTrades - winningTrades;
                const profit = (winningTrades * 20) - (losingTrades * 10); // $20 profit per win, $10 loss per loss
                const profitPercentage = (profit / accountSize) * 100;

                return (
                  <div key={winRate} className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-300">
                    <div className="text-2xl font-bold text-white/90 mb-2">{winRate}% Win Rate</div>
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      +${profit.toLocaleString()}
                    </div>
                    <div className="text-sm text-white/40 mb-4">
                      {profitPercentage.toFixed(1)}% return
                    </div>
                    <div className="text-xs text-white/30">
                      {winningTrades} wins, {losingTrades} losses
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <p className="text-white/40 text-sm">
                Calculations based on 1:2 Risk/Reward ratio. Results may vary based on market conditions and individual trading performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 👥 Success Stories: Social Proof - Testimonials */}
      <motion.section
        ref={successRef}
        className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden"
        style={{ y: successY, opacity: successOpacity }}
      >
        {/* Elegant Shape Background */}
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.1}
            width={400}
            height={100}
            rotate={20}
            gradient="from-emerald-500/[0.06]"
            className="left-[-10%] top-[15%]"
          />
          <ElegantShape
            delay={0.3}
            width={320}
            height={80}
            rotate={-25}
            gradient="from-purple-500/[0.06]"
            className="right-[-8%] bottom-[25%]"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <FUITestimonialWithSlide />

          <div className="text-center mb-0 mt-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight pt-16">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Verified Payouts from{' '}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                Prop Firms
              </span>
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto font-light">
              Real-world proof of our traders' success in clearing challenges and receiving substantial payouts.
            </p>
          </div>

          <ImageAutoSlider />

          {/* Review Summary Card */}
          <div className="flex justify-center mt-4">
            <ReviewSummaryCard
              rating={4.8}
              reviewCount={1847}
              summaryText="Trusted by traders worldwide for exceptional results."
            />
          </div>
        </div>
      </motion.section>

      {/* 🏆 Verified Payouts Gallery: Proof - Real certificates from prop firms */}
      {/* Note: This is included in the Success Stories section above with ImageAutoSlider */}

      {/* 📚 Traders Edge Blog: Authority - SEO-friendly educational articles */}
      <TradersEdgeBlog />

      {/* ❓ Comprehensive FAQ: Objection Killing - Safety and compliance answers */}
      <ComprehensiveFAQ />

      {/* Exit-Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#030303] border border-white/[0.1] rounded-3xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowExitPopup(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Don't Leave Yet!</h3>
              <p className="text-white/60 text-sm">
                Get your FREE Prop Firm Risk Management Calculator - the essential tool every trader needs.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
              >
                Get Free Calculator
              </button>
            </form>

            <p className="text-xs text-white/40 text-center mt-4">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>
      )}

      {/* Floating Conversion Hub */}
      <FloatingConversionHub />
    </div>
  </div>
  </SEOWrapper>
  );
};

export default ProductionLandingPage;
