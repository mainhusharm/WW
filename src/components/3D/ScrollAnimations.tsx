import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationsProps {
  children: React.ReactNode;
}

const ScrollAnimations: React.FC<ScrollAnimationsProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    if (!containerRef.current) return;

    // Hero section animations
    gsap.fromTo('.hero-title', 
      { 
        opacity: 0, 
        y: 100, 
        scale: 0.8,
        rotationX: 45 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotationX: 0,
        duration: 1.5, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.hero-title',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    gsap.fromTo('.hero-subtitle', 
      { 
        opacity: 0, 
        y: 50,
        filter: 'blur(10px)'
      },
      { 
        opacity: 1, 
        y: 0,
        filter: 'blur(0px)',
        duration: 1, 
        delay: 0.3,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.hero-subtitle',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Feature cards stagger animation
    gsap.fromTo('.feature-card', 
      { 
        opacity: 0, 
        y: 80,
        rotationY: 45,
        scale: 0.8
      },
      { 
        opacity: 1, 
        y: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.8, 
        stagger: 0.2,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.features-section',
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Stats counter animation
    gsap.fromTo('.stat-number', 
      { 
        textContent: 0,
        opacity: 0,
        scale: 0.5
      },
      { 
        textContent: (i, target) => target.getAttribute('data-value'),
        opacity: 1,
        scale: 1,
        duration: 2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: '.stats-section',
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Parallax scrolling effects
    gsap.to('.parallax-bg', {
      yPercent: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: '.parallax-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });

    // 3D card hover effects
    const cards = document.querySelectorAll('.hover-3d');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          rotationY: 10,
          rotationX: 5,
          z: 50,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotationY: 0,
          rotationX: 0,
          z: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isLoaded]);

  return (
    <div ref={containerRef} className="scroll-animations-container">
      {children}
    </div>
  );
};

export default ScrollAnimations;
