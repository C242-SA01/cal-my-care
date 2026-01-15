import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Custom hook untuk menyimpan state form ke sessionStorage.
 * Ini membantu menjaga input pengguna saat reload halaman atau pindah tab.
 *
 * @param storageKey Kunci unik untuk data form di sessionStorage.
 * @param initialState State awal untuk form.
 * @returns Tuple yang berisi state, fungsi untuk update state, dan fungsi untuk membersihkan state.
 */
export function useFormPersistence<T>(
  storageKey: string,
  initialState: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  
  // Inisialisasi state dari sessionStorage, atau gunakan state awal jika tidak ada.
  const [state, setState] = useState<T>(() => {
    try {
      const storedItem = sessionStorage.getItem(storageKey);
      if (storedItem && storedItem !== 'undefined') {
        return JSON.parse(storedItem);
      }
    } catch (error) {
      console.error("Gagal membaca dari sessionStorage:", error);
    }
    return initialState;
  });

  // Tulis ke sessionStorage setiap kali state berubah.
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("Gagal menulis ke sessionStorage:", error);
    }
  }, [state, storageKey]);

  // Fungsi untuk membersihkan state dari sessionStorage.
  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setState(initialState);
    } catch (error) {
      console.error("Gagal membersihkan sessionStorage:", error);
    }
  }, [storageKey, initialState]);

  // Kembalikan state dan fungsi setState asli dari React, yang dijamin stabil.
  return [state, setState, clearState];
}
