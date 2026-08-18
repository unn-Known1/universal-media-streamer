import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Keep a live ref of the current value so multiple functional updates
  // within the same render cycle never operate on stale state.
  const valueRef = useRef(storedValue);
  valueRef.current = storedValue;

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const prev = valueRef.current;
      const valueToStore = value instanceof Function ? value(prev) : value;
      valueRef.current = valueToStore;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          valueRef.current = parsed;
          setStoredValue(parsed);
        } catch {
          valueRef.current = initialValue;
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const valueRef = useRef(storedValue);
  valueRef.current = storedValue;

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const prev = valueRef.current;
      const valueToStore = value instanceof Function ? value(prev) : value;
      valueRef.current = valueToStore;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}