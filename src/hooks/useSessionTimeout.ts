import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutProps {
  timeout: number; // in milliseconds
  onTimeout: () => void;
  onWarning?: () => void;
  warningTime?: number; // in milliseconds before timeout
  enabled?: boolean;
}

export const useSessionTimeout = ({
  timeout,
  onTimeout,
  onWarning,
  warningTime = 60000, // 1 minute default
  enabled = true
}: UseSessionTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    clearTimers();
    lastActivityRef.current = Date.now();

    // Set warning timer
    if (onWarning && warningTime < timeout) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, timeout - warningTime);
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  }, [enabled, timeout, onTimeout, onWarning, warningTime, clearTimers]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Activity events to monitor
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimers();
    };
  }, [enabled, handleActivity, resetTimer, clearTimers]);

  return {
    resetTimer,
    clearTimers
  };
};