import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MessageCircle,
  Send,
  Clock,
  MapPin,
  User,
  MessageSquare,
  Building,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import Header from './Header';

const contactMethods = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get in touch via email",
    value: "traderredgepro@gmail.com",
    link: "mailto:traderredgepro@gmail.com",
    gradient: "from-blue-500/20 to-cyan-500/20",
    hoverColor: "blue"
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Available 24/7 for premium members",
    value: "Chat with our team",
    link: "#",
    gradient: "from-green-500/20 to-emerald-500/20",
    hoverColor: "green"
  },
  {
    icon: Clock,
    title: "Response Time",
    description: "Within 24 hours",
    value: "Fast support",
    link: "#",
    gradient: "from-purple-500/20 to-pink-500/20",
    hoverColor: "purple"
  }
];

const companyStats = [
  { label: "Response Time", value: "< 2 hours", icon: Clock },
  { label: "Global Clients", value: "2,847+", icon: Globe },
  { label: "Security Level", value: "Enterprise", icon: Shield },
  { label: "Success Rate", value: "99.9%", icon: Zap }
];

const ContactSupport: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Save to admin dashboard Transferred Queries
      const transferredQuery = {
        chatId: `support_${Date.now()}`,
        userId: formData.email,
        userName: formData.name,
        query: `${formData.subject}: ${formData.message}`,
        messages: [{
          id: Date.now(),
          text: formData.message,
          sender: 'user',
          timestamp: new Date().toISOString()
        }],
        timestamp: new Date().toISOString(),
        status: 'waiting',
        priority: formData.priority as 'high' | 'medium' | 'low'
      };

      // Save to localStorage for admin dashboard
      const existingChats = JSON.parse(localStorage.getItem('admin_transferred_chats') || '[]');
      existingChats.unshift(transferredQuery);
      localStorage.setItem('admin_transferred_chats', JSON.stringify(existingChats.slice(0, 100))); // Keep last 100

      // Send to backend API
      let apiEndpoint;
      if (window.location.hostname === 'localhost') {
        apiEndpoint = '/api/support/contact';
      } else {
        apiEndpoint = 'https://backend-bkt7.onrender.com/api/support/contact';
      }
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '', priority: 'medium' });
        }, 3000);
      } else {
        alert('Failed to send message. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-950/20 to-black text-white overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient mesh */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.05] to-rose-500/[0.08]"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundSize: '400% 400%'
          }}
        />

        {/* Moving orbs */}
        <motion.div
          className="absolute top-1/3 left-1/5 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 200, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/5 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -150, 0],
            y: [0, -80, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Communication lines */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-40 bg-gradient-to-b from-transparent via-white/20 to-transparent"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${25 + (i * 8)}%`,
                transform: `rotate(${30 + i * 20}deg)`
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scaleY: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      <Header />

      <motion.div
        ref={containerRef}
        className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20"
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
              ✨ Need Help?
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </motion.div>

          <motion.h2
            className="text-4xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight"
            variants={fadeInUp}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Contact{' '}
            </span>
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-rose-300"
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
              Support
            </motion.span>
          </motion.h2>

          <motion.p
            className="text-xl sm:text-2xl text-white/60 max-w-4xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            Need help? Our expert support team is here to assist you with any questions or issues you may have.
          </motion.p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          variants={fadeInUp}
        >
          {companyStats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center p-6 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.15] group hover:bg-white/[0.08] transition-all"
              whileHover={{ scale: 1.05, y: -5 }}
              variants={fadeInUp}
            >
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center mx-auto mb-3"
                whileHover={{ rotateY: 180 }}
                transition={{ duration: 0.6 }}
              >
                <stat.icon className="w-6 h-6 text-indigo-300" />
              </motion.div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            className="space-y-8"
            variants={fadeInUp}
          >
            <div>
              <h3 className="text-3xl font-bold text-white mb-4 flex items-center">
                <Send className="w-6 h-6 mr-3 text-cyan-400" />
                Send us a Message
              </h3>
              <p className="text-white/60 text-lg">
                Tell us about your issue and we'll get back to you within 24 hours.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full pl-10 pr-4 py-4 bg-white/[0.08] border rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-all ${
                          errors.name ? 'border-red-400' : 'border-white/[0.15]'
                        }`}
                      />
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-sm mt-2"
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-10 pr-4 py-4 bg-white/[0.08] border rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-all ${
                          errors.email ? 'border-red-400' : 'border-white/[0.15]'
                        }`}
                      />
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-sm mt-2"
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-white/[0.08] border border-white/[0.15] rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-all"
                    >
                      <option value="low" className="bg-gray-800">Low Priority</option>
                      <option value="medium" className="bg-gray-800">Medium Priority</option>
                      <option value="high" className="bg-gray-800">High Priority</option>
                      <option value="urgent" className="bg-gray-800">Urgent</option>
                    </select>
                  </div>

                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-4 h-5 w-5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className={`w-full pl-10 pr-4 py-4 bg-white/[0.08] border rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-all ${
                        errors.subject ? 'border-red-400' : 'border-white/[0.15]'
                      }`}
                    />
                    {errors.subject && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-2"
                      >
                        {errors.subject}
                      </motion.p>
                    )}
                  </div>

                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-4 h-5 w-5 text-white/40" />
                    <textarea
                      placeholder="Tell us about your issue..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={`w-full pl-10 pr-4 py-4 bg-white/[0.08] border rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-all resize-none ${
                        errors.message ? 'border-red-400' : 'border-white/[0.15]'
                      }`}
                    />
                    {errors.message && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-2"
                      >
                        {errors.message}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send Message
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">Message Sent!</h3>
                  <p className="text-white/60 text-lg mb-6">
                    Your message has been sent successfully! We will get back to you within 24 hours.
                  </p>
                  <motion.button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '', priority: 'medium' });
                    }}
                    className="px-6 py-3 bg-white/[0.08] border border-white/[0.15] rounded-xl text-white hover:bg-white/[0.12] transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Send Another Message
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Contact Methods */}
          <motion.div
            className="space-y-8"
            variants={fadeInUp}
          >
            <div>
              <h3 className="text-3xl font-bold text-white mb-4">Get in Touch</h3>
              <p className="text-white/60 text-lg">
                Choose the method that works best for you.
              </p>
            </div>

            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={index}
                  href={method.link}
                  className="block p-6 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.15] hover:bg-white/[0.08] transition-all group"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.gradient} border border-white/20 flex items-center justify-center`}
                      whileHover={{ scale: 1.1, rotateY: 180 }}
                      transition={{ duration: 0.6 }}
                    >
                      <method.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-white mb-1">{method.title}</h4>
                      <p className="text-white/60 text-sm mb-2">{method.description}</p>
                      <p className="text-white font-medium">{method.value}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Support Hours */}
            <motion.div
              className="p-6 bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.08] backdrop-blur-xl rounded-2xl border border-indigo-400/30"
              variants={fadeInUp}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Support Hours</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Monday - Friday</span>
                  <span className="text-white">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Saturday</span>
                  <span className="text-white">10:00 AM - 4:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Sunday</span>
                  <span className="text-white">Closed</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-xs text-cyan-300">
                  <strong>Premium Support:</strong> Elite and Professional members get priority support with faster response times.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + (i * 10)}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default ContactSupport;
