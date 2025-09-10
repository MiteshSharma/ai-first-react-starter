import { useState, useCallback } from 'react';
import { Result, createSuccess, createError } from '@utils/types';

/**
 * @hook useAsyncOperation
 * @description Hook for managing async operations with loading states and error handling
 * @template T - Return type of the async operation
 * @returns Object with execute function, loading state, error, and data
 */
export const useAsyncOperation = <T>(): {
  execute: (operation: () => Promise<T>) => Promise<Result<T, Error>>;
  reset: () => void;
  loading: boolean;
  error: string | null;
  data: T | null;
  hasData: boolean;
  hasError: boolean;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>
  ): Promise<Result<T, Error>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      setData(result);
      setLoading(false);
      return createSuccess(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return createError(err instanceof Error ? err : new Error(errorMessage));
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    reset,
    loading,
    error,
    data,
    hasData: data !== null,
    hasError: error !== null,
  };
};

/**
 * @hook useAsyncCallback
 * @description Hook for creating async callbacks with automatic error handling
 * @template T - Parameters type
 * @template R - Return type
 * @param callback The async callback function
 * @returns Object with execute function and state management
 */
export const useAsyncCallback = <T extends unknown[], R>(
  callback: (...args: T) => Promise<R>
): {
  execute: (...args: T) => Promise<Result<R, Error>>;
  loading: boolean;
  error: string | null;
  hasError: boolean;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: T): Promise<Result<R, Error>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await callback(...args);
      setLoading(false);
      return createSuccess(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return createError(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [callback]);

  return {
    execute,
    loading,
    error,
    hasError: error !== null,
  };
};