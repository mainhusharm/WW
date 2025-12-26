import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  lazy?: boolean;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  lazy = true,
  className = '',
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate alt text based on context if not provided
  const generateAltText = () => {
    if (alt) return alt;

    // Extract context from src or className
    if (src.includes('signal') || src.includes('chart')) {
      return `Trading chart showing market analysis and signal data`;
    }
    if (src.includes('payout') || src.includes('payment')) {
      return `Verified payout confirmation from prop firm`;
    }
    if (src.includes('testimonial') || src.includes('review')) {
      return `Customer testimonial and success story`;
    }
    if (src.includes('logo')) {
      return `TraderEdge Pro company logo`;
    }

    return `Trading education and prop firm clearing content`;
  };

  const finalAlt = generateAltText();

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (width && height) {
        link.setAttribute('imagesrcset', `${src} ${width}w`);
        link.setAttribute('imagesizes', `${width}px`);
      }
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, width, height]);

  return (
    <div
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={{
        width: width || 'auto',
        height: height || 'auto',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="image-placeholder"
          style={{
            width: '100%',
            height: '100%',
            background: placeholder || 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px'
          }}
        >
          {placeholder ? null : 'Loading...'}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div
          className="image-error"
          style={{
            width: '100%',
            height: '100%',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px',
            border: '1px solid #ddd'
          }}
        >
          Failed to load image
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={finalAlt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes loading {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `
      }} />
    </div>
  );
};

// Hook for preloading critical resources
export const usePreloadResources = (resources: string[]) => {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.js') ? 'script' :
               resource.endsWith('.css') ? 'style' : 'image';
      document.head.appendChild(link);
    });
  }, [resources]);
};

// Critical CSS inlining hook
export const useCriticalCSS = (css: string) => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [css]);
};

// Web Vitals tracking hook
export const useWebVitals = () => {
  useEffect(() => {
    // CLS (Cumulative Layout Shift) prevention
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });
    observer.observe({ entryTypes: ['layout-shift'] });

    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay) - requires user interaction
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('FID:', (entry as any).processingStart - entry.startTime);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    return () => {
      observer.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
    };
  }, []);
};

export default OptimizedImage;
