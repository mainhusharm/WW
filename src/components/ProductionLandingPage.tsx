import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
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
import { cn } from '../lib/utils';

const ProductionLandingPage = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Professional Guidance",
      description: "Expert support for prop firm challenges with proven strategies and personalized coaching.",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Precision Trading",
      description: "Advanced analytics and risk management tools to maximize your trading success.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community Support",
      description: "Join thousands of successful traders in our exclusive community and Discord.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-time Analytics",
      description: "Comprehensive performance tracking and detailed reporting for your trades.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast Execution",
      description: "Lightning-fast trade execution with minimal slippage and optimal pricing.",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Proven Results",
      description: "Over 2,847 successful traders have cleared their challenges with our help.",
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

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: i * 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative">
      {/* Global Geometric Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <ElegantShape
          delay={0.3}
          width={500}
          height={120}
          rotate={12}
          gradient="from-cyan-500/[0.12]"
          className="left-[-10%] top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={400}
          height={100}
          rotate={-15}
          gradient="from-blue-500/[0.12]"
          className="right-[-5%] top-[70%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-indigo-500/[0.12]"
          className="left-[5%] bottom-[10%]"
        />
      </div>

      <Header />

      {/* Hero Section with 3D Animation */}
      <section className="relative">
        <InfiniteHero />
      </section>

      {/* Stats Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        {/* Elegant Shape Background */}
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.2}
            width={300}
            height={80}
            rotate={15}
            gradient="from-cyan-500/[0.08]"
            className="left-[-5%] top-[20%]"
          />
          <ElegantShape
            delay={0.4}
            width={250}
            height={60}
            rotate={-10}
            gradient="from-blue-500/[0.08]"
            className="right-[-3%] bottom-[30%]"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="text-center p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500"
              >
                <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-white/50 font-light tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
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
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
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
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500"
              >
                <div className="mb-6 text-cyan-400/80 group-hover:text-cyan-400 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white/90 mb-3 group-hover:text-white transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-white/40 leading-relaxed font-light group-hover:text-white/50 transition-colors duration-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Parallax Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-blue-500/[0.05]" />

        {/* Gradient Tracing Background - Next-Level Trading */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none">
          <GradientTracing
            width={800}
            height={400}
            gradientColors={["#2EB9DF", "#2EB9DF", "#9E00FF"]}
            animationDuration={3}
            strokeWidth={2}
            path="M0,200 Q200,100 400,200 T800,200"
          />
        </div>

        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white/90 to-blue-300">
              Next-Level Trading
            </span>
          </h2>
          <p className="text-xl text-white/40 font-light">
            Experience the future of prop firm trading with our advanced analytics platform
          </p>
        </motion.div>
      </section>

      {/* Premium Testimonials */}
      <PremiumTestimonials />

      {/* Combined Membership Plans */}
      <CombinedMembershipPlans />

      {/* Final CTA */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
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

        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="p-16 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Ready to Clear Your{" "}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                Prop Firm Challenge
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                ?
              </span>
            </h2>
            <p className="text-lg text-white/40 mb-12 font-light max-w-2xl mx-auto">
              Join thousands of successful traders who have cleared their challenges with our professional guidance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/membership"
                className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 backdrop-blur-sm"
              >
                <span className="relative z-10 flex items-center gap-2 text-white/90 font-light">
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
              <Link
                to="/contact"
                className="group relative px-8 py-4 rounded-full bg-white/[0.03] border border-white/[0.1] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300 backdrop-blur-sm"
              >
                <span className="relative z-10 text-white/70 hover:text-white/90 font-light transition-colors duration-300">
                  Get Support
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default ProductionLandingPage;
