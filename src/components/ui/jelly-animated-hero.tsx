import React, { useRef, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { WaveAnimation } from './wave-animation-1';

export default function FUIHeroWithJelly() {
  const textControls = useAnimation();
  const buttonControls = useAnimation();

  useEffect(() => {
    textControls.start(i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05 + 1.5,
        duration: 1.2,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    }));
    buttonControls.start({
        opacity: 1,
        transition: { delay: 2.5, duration: 1 }
    });
  }, [textControls, buttonControls]);

  const headline = "Master Your Funded Account Journey";

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#030303]">
      {/* Wave Animation Background */}
      <WaveAnimation
        waveSpeed={3}
        waveIntensity={50}
        particleColor="#8B5CF6"
        pointSize={2}
        gridDistance={2}
        className="absolute inset-0 z-1"
      />

      <div className="absolute top-48 left-1/2 transform -translate-x-1/2 z-10 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl whitespace-nowrap"
          style={{ textShadow: '0 0 50px rgba(0, 0, 0, 0.1)' }}
        >
          {headline}
        </motion.h1>
        <motion.p
          custom={headline.length}
          initial={{ opacity: 0, y: 30 }}
          animate={textControls}
          className="mx-auto mt-4 max-w-xl text-xl text-cyan-300 font-light"
        >
          "Where Trading Meets Risk Control"
        </motion.p>
        <motion.p
          custom={headline.length + 30}
          initial={{ opacity: 0, y: 30 }}
          animate={textControls}
          className="mx-auto mt-6 max-w-xl text-lg text-slate-300"
        >
          Professional clearing service for prop firm challenges with custom trading plans and expert guidance
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
          animate={buttonControls}
          initial={{ opacity: 0 }}
        >
          <Link
            to="/membership"
            className="group relative px-8 py-4 rounded-full bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300 backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center gap-2 text-white/90 font-light">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
