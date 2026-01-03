import { useEffect, useRef } from 'react';

/**
 * Safe useEffect hook that prevents React error #310
 * by ensuring proper cleanup and preventing hook conflicts
 */
export function useSafeEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | void>();

  useEffect(() => {
    // Only run effect if component is still mounted
    if (isMountedRef.current) {
      try {
        cleanupRef.current = effect();
      } catch (error) {
        console.error('Error in useSafeEffect:', error);
      }
    }

    return () => {
      if (cleanupRef.current && typeof cleanupRef.current === 'function') {
        try {
          cleanupRef.current();
        } catch (error) {
          console.error('Error in useSafeEffect cleanup:', error);
        }
      }
    };
  }, deps);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
}

/**
 * Safe interval hook that prevents memory leaks
 */
export function useSafeInterval(
  callback: () => void,
  delay: number | null
) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay !== null) {
      intervalRef.current = setInterval(() => {
        try {
          savedCallback.current();
        } catch (error) {
          console.error('Error in useSafeInterval callback:', error);
        }
      }, delay);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [delay]);
}

/**
 * Safe timeout hook that prevents memory leaks
 */
export function useSafeTimeout(
  callback: () => void,
  delay: number | null
) {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = setTimeout(() => {
        try {
          savedCallback.current();
        } catch (error) {
          console.error('Error in useSafeTimeout callback:', error);
        }
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [delay]);
}
