'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Testimonial = {
  image: string;
  audio: string;
  text: string;
  name: string;
  jobtitle: string;
  rating?: number;
};

type ComponentProps = {
  testimonials: Testimonial[];
};

export const Component: React.FC<ComponentProps> = ({ testimonials }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [hasBeenHovered, setHasBeenHovered] = useState<boolean[]>(new Array(testimonials.length).fill(false));
  const [typedText, setTypedText] = useState('');
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef('');

  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current.src = '';
      audioPlayerRef.current.load();
      audioPlayerRef.current = null;
    }
  }, []);

  const startTypewriter = useCallback((text: string) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setTypedText('');
    currentTextRef.current = text;

    let i = 0;
    const type = () => {
      if (i <= text.length) {
        setTypedText(text.slice(0, i));
        i++;
        typewriterTimeoutRef.current = setTimeout(type, 50);
      }
    };
    type();
  }, []);

  const stopTypewriter = useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setTypedText('');
    currentTextRef.current = '';
  }, []);

  const handleMouseEnter = useCallback((index: number) => {
    stopAudio();

    setHoveredIndex(index);

    const newAudio = new Audio(`/audio/${testimonials[index].audio}`);
    audioPlayerRef.current = newAudio;
    newAudio.play().catch(e => {
      console.warn("Audio playback prevented or failed:", e);
    });

    setHasBeenHovered(prev => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
    startTypewriter(testimonials[index].text);
  }, [testimonials, stopAudio, startTypewriter]);


  const handleMouseLeave = useCallback(() => {
    stopAudio();
    setHoveredIndex(null);
    stopTypewriter();
  }, [stopAudio, stopTypewriter]);

  useEffect(() => {
    return () => {
      stopAudio();
      stopTypewriter();
    };
  }, [stopAudio, stopTypewriter]);

  return (
    <div className="flex justify-center items-center gap-4 flex-wrap">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          className="relative flex flex-col items-center"
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.img
            src={testimonial.image}
            alt={`Testimonial ${index}`}
            className="w-16 h-16 rounded-full border-4 hover:animate-pulse border-gray-300"
            animate={{
              borderColor: (hoveredIndex === index || hasBeenHovered[index]) ? '#ACA0FB' : '#E5E7EB'
            }}
            transition={{ duration: 0.3 }}
          />
          <AnimatePresence>
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.4 }}
                className="fixed bottom-20 bg-white text-black text-sm px-4 py-3 rounded-lg shadow-2xl max-w-xs w-56 z-[9999] pointer-events-none"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="h-24 overflow-hidden whitespace-pre-wrap">
                  {typedText}
                  <span className="animate-blink">|</span>
                </div>
                {testimonial.rating && (
                  <div className="flex justify-end gap-1 mt-2 mb-1">
                    {[...Array(Math.floor(testimonial.rating))].map((_, starIndex) => (
                      <svg key={starIndex} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    {testimonial.rating % 1 !== 0 && (
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <defs>
                          <linearGradient id={`half-star-${index}`}>
                            <stop offset={`${(testimonial.rating % 1) * 100}%`} stopColor="currentColor" />
                            <stop offset={`${(testimonial.rating % 1) * 100}%`} stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        <path fill={`url(#half-star-${index})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </div>
                )}
                <p className="mt-2 text-right font-semibold">{testimonial.name}</p>
                <p className="text-right text-gray-500 text-sm">{testimonial.jobtitle}</p>
                <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-4">
                  <div className="w-3 h-3 bg-white rounded-full shadow-lg"></div>
                  <div className="w-2 h-2 bg-white rounded-full shadow-lg mt-1"></div>
                  <div className="w-1 h-1 bg-white rounded-full shadow-lg mt-1"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};
