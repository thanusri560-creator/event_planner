import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value updates (e.g. text inputs or sliders).
 * Prevents redundant computations or API requests during active user typing/sliding.
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
