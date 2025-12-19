"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Marcus Thompson",
    role: "FTMO Funded Trader",
    achievement: "$100K Account",
    profile: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "Passed my FTMO challenge in just 8 days using their risk management system. The position sizing calculator was a game changer!"
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "MyForexFunds Trader",
    achievement: "Phase 2 Cleared",
    profile: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "The custom trading plan helped me stay disciplined. Cleared both phases without hitting drawdown limits. Highly recommend!"
  },
  {
    id: 3,
    name: "David Martinez",
    role: "The5%ers Funded",
    achievement: "$200K Challenge",
    profile: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "Professional signals and expert guidance made all the difference. Got funded within 3 weeks and already made my first payout!"
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    role: "Funded Trader",
    achievement: "$50K Account",
    profile: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "After failing 3 challenges on my own, their prop firm rules system helped me finally pass. The support team is amazing!"
  },
  {
    id: 5,
    name: "James Wilson",
    role: "Apex Trader Funded",
    achievement: "$150K Account",
    profile: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "Best investment in my trading career. The AI-powered signals are incredibly accurate. Passed my evaluation in 12 days!"
  },
  {
    id: 6,
    name: "Lisa Anderson",
    role: "Blue Guardian Funded",
    achievement: "Live Account",
    profile: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "The phase tracking feature kept me focused and aware of my progress. Support team answered all my questions instantly!"
  },
  {
    id: 7,
    name: "Michael Brown",
    role: "E8 Funding Trader",
    achievement: "$100K Cleared",
    profile: "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "Game-changing platform! The lot size calculator alone saved me from multiple blown accounts. Now trading with confidence."
  },
  {
    id: 8,
    name: "Sophia Taylor",
    role: "FundedNext Trader",
    achievement: "$200K Phase 1",
    profile: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150",
    rating: 5,
    text: "The personalized trading plans are worth every penny. Cleared Phase 1 in record time and working on Phase 2 now!"
  },
];

const safeImage = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  target.src = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150";
};

const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState<'xs' | 'sm' | 'md' | 'lg'>('lg');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) setScreenSize('xs');
      else if (width < 640) setScreenSize('sm');
      else if (width < 768) setScreenSize('md');
      else setScreenSize('lg');
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return screenSize;
};

export default function OrbitingReviewsCarousel() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const screenSize = useResponsive();

  const getResponsiveValues = () => {
    switch (screenSize) {
      case 'xs':
        return {
          containerRadius: 100,
          profileSize: 45,
          cardWidth: 'w-72',
          avatarSize: 'w-12 h-12',
          avatarMargin: '-mt-8',
          fontSize: {
            name: 'text-sm',
            role: 'text-xs',
            achievement: 'text-xs'
          }
        };
      case 'sm':
        return {
          containerRadius: 120,
          profileSize: 55,
          cardWidth: 'w-80',
          avatarSize: 'w-14 h-14',
          avatarMargin: '-mt-9',
          fontSize: {
            name: 'text-base',
            role: 'text-xs',
            achievement: 'text-xs'
          }
        };
      case 'md':
        return {
          containerRadius: 150,
          profileSize: 65,
          cardWidth: 'w-96',
          avatarSize: 'w-16 h-16',
          avatarMargin: '-mt-10',
          fontSize: {
            name: 'text-base',
            role: 'text-sm',
            achievement: 'text-xs'
          }
        };
      default:
        return {
          containerRadius: 200,
          profileSize: 80,
          cardWidth: 'w-[32rem]',
          avatarSize: 'w-20 h-20',
          avatarMargin: '-mt-12',
          fontSize: {
            name: 'text-lg',
            role: 'text-sm',
            achievement: 'text-xs'
          }
        };
    }
  };

  const { containerRadius, profileSize, cardWidth, avatarSize, avatarMargin, fontSize } = getResponsiveValues();
  const containerSize = containerRadius * 2 + 100;

  const getRotation = React.useCallback(
    (index: number): number => (index - activeIndex) * (360 / reviews.length),
    [activeIndex]
  );

  const next = () => setActiveIndex((i) => (i + 1) % reviews.length);
  const prev = () => setActiveIndex((i) => (i - 1 + reviews.length) % reviews.length);

  const handleProfileClick = React.useCallback((index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
  }, [activeIndex]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') prev();
      else if (event.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (isHovering) return;

    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovering]);

  return (
    <div
      className="flex flex-col items-center p-2 sm:p-4 relative min-h-[350px] sm:min-h-[400px] transition-colors duration-300"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={reviews[activeIndex].id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            className={`z-10 bg-gray-800/90 backdrop-blur-sm shadow-xl shadow-gray-900/50 rounded-xl p-4 sm:p-5 md:p-6 ${cardWidth} text-center border border-gray-700/50`}
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              src={reviews[activeIndex].profile}
              alt={reviews[activeIndex].name}
              onError={safeImage}
              className={`${avatarSize} rounded-full mx-auto ${avatarMargin} border-4 border-gray-950 object-cover shadow-md`}
            />
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <h2 className={`mt-2 font-bold text-white ${fontSize.name}`}>
                {reviews[activeIndex].name}
              </h2>
              <div className={`flex items-center justify-center text-gray-400 mt-1 ${fontSize.role}`}>
                <TrendingUp size={12} className="mr-1" />
                <span className="truncate">{reviews[activeIndex].role}</span>
              </div>
              <div className={`flex items-center justify-center text-green-400 font-semibold mt-0.5 ${fontSize.achievement}`}>
                <span className="truncate">{reviews[activeIndex].achievement}</span>
              </div>

              <div className="flex justify-center mt-2 space-x-1">
                {[...Array(reviews[activeIndex].rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-300 text-sm mt-3 leading-relaxed max-h-24 overflow-y-auto">
                "{reviews[activeIndex].text}"
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center items-center mt-4 space-x-2"
            >
              <button
                onClick={prev}
                className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-300" />
              </button>
              <button className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-green-400 to-cyan-500 text-white hover:from-green-500 hover:to-cyan-600 transition-all">
                Read More
              </button>
              <button
                onClick={next}
                className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {reviews.map((review, i) => {
          const rotation = getRotation(i);
          const isActive = i === activeIndex;

          return (
            <motion.div
              key={review.id}
              animate={{
                transform: `rotate(${rotation}deg) translateY(-${containerRadius}px)`,
              }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 20,
                delay: isActive ? 0 : Math.abs(i - activeIndex) * 0.05
              }}
              style={{
                width: profileSize,
                height: profileSize,
                position: "absolute",
                top: `calc(50% - ${profileSize / 2}px)`,
                left: `calc(50% - ${profileSize / 2}px)`,
                zIndex: isActive ? 20 : 10,
              }}
            >
              <motion.div
                animate={{ rotate: -rotation }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 20,
                }}
                className="w-full h-full"
              >
                <motion.img
                  src={review.profile}
                  alt={review.name}
                  onError={safeImage}
                  onClick={() => handleProfileClick(i)}
                  whileHover={{
                    scale: 1.15,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full h-full object-cover rounded-full cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "border-4 border-green-400 shadow-lg shadow-green-400/50"
                      : "border-2 border-gray-600 hover:border-cyan-400"
                  }`}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center mt-4 sm:mt-6 space-x-1.5 sm:space-x-2">
        {reviews.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
              index === activeIndex
                ? "bg-green-400"
                : "bg-gray-600"
            }`}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>
  );
}
