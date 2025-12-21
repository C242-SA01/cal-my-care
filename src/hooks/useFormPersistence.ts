import { useState, useEffect, useCallback } from 'react';

/**
 * A custom hook to persist form state in sessionStorage.
 * This helps preserve user input across page reloads or tab switches,
 * significantly improving user experience for long or complex forms.
 *
 * @param storageKey A unique key to identify the form's data in sessionStorage.
 * @param initialState The default state for the form.
 * @returns A tuple containing the state, a state updater function, and a function to clear the persisted state.
 */
export function useFormPersistence<T>(storageKey: string, initialState: T): [T, (newState: T) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedItem = sessionStorage.getItem(storageKey);
      return storedItem ? JSON.parse(storedItem) : initialState;
    } catch (error) {
      console.error(`Error reading from sessionStorage for key "${storageKey}":`, error);
      return initialState;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing to sessionStorage for key "${storageKey}":`, error);
    }
  }, [state, storageKey]);

  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setState(initialState);
    } catch (error) {
      console.error(`Error clearing sessionStorage for key "${storageKey}":`, error);
    }
  }, [storageKey, initialState]);

  const updateState = useCallback((newState: T) => {
    setState(newState);
  }, []);

  return [state, updateState, clearState];
}
