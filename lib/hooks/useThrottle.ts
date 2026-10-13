import { useState, useEffect, useRef, useCallback } from "react";

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Returns a throttled value that updates at most once per specified delay interval.
 */
export function useThrottle<T>(value: T, delay: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecutedRef = useRef<number>(Date.now());

  useEffect(() => {
    const elapsed = Date.now() - lastExecutedRef.current;
    if (elapsed >= delay) {
      setThrottledValue(value);
      lastExecutedRef.current = Date.now();
      return;
    }

    const timer = setTimeout(() => {
      setThrottledValue(value);
      lastExecutedRef.current = Date.now();
    }, delay - elapsed);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Creates a production-grade throttled callback function.
 * Guarantees immediate leading execution by default, ignores rapid repeated calls within the delay window,
 * and handles component unmount cleanup safely.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 800,
  options: ThrottleOptions = { leading: true, trailing: false }
): ((...args: Parameters<T>) => ReturnType<T> | undefined) & {
  cancel: () => void;
  flush: () => void;
} {
  const { leading = true, trailing = false } = options;
  const callbackRef = useRef<T>(callback);
  const lastExecutedRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current && lastArgsRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      lastExecutedRef.current = Date.now();
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
    }
  }, []);

  const throttledCallback = useCallback(
    (...args: Parameters<T>): ReturnType<T> | undefined => {
      const now = Date.now();
      const elapsed = now - lastExecutedRef.current;
      lastArgsRef.current = args;

      if (elapsed >= delay) {
        if (leading) {
          lastExecutedRef.current = now;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          return callbackRef.current(...args);
        }
      }

      if (trailing && !timerRef.current) {
        const remaining = delay - elapsed;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          lastExecutedRef.current = Date.now();
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
            lastArgsRef.current = null;
          }
        }, Math.max(0, remaining));
      }

      return undefined;
    },
    [delay, leading, trailing]
  );

  return Object.assign(throttledCallback, { cancel, flush });
}
