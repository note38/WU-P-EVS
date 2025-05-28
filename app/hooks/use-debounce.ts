import { useEffect, useState, useRef, useCallback } from "react";

export function useDebounce<T>(value: T, delay: number): T {
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

// Optimized API call hook with caching
export function useOptimizedFetch<T>(
  url: string,
  options?: RequestInit,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(
    new Map()
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      // Check cache first (5 minute cache) unless force refresh is requested
      const cached = cacheRef.current.get(url);
      if (
        !forceRefresh &&
        cached &&
        Date.now() - cached.timestamp < 5 * 60 * 1000
      ) {
        setData(cached.data);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);

        // Cache the result
        cacheRef.current.set(url, { data: result, timestamp: Date.now() });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [url, ...dependencies]
  );

  // Force refresh function that bypasses cache
  const forceRefetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    // Check if URL contains timestamp parameter to force refresh
    const urlObj = new URL(url, window.location.origin);
    const hasTimestamp = urlObj.searchParams.has("_t");
    fetchData(hasTimestamp);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, forceRefetch };
}

// Throttle hook for reducing function call frequency
export function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}
