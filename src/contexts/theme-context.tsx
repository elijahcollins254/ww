import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
type ColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colorScheme: ColorScheme;
  colors: (typeof Colors)[ColorScheme];
};

const STORAGE_KEY = 'wildwash-theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [mode, setMode] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);
  const colorScheme = mode === 'system' ? systemScheme : mode;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedMode) => {
        if (active && (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark')) {
          setMode(storedMode);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready) void AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => undefined);
  }, [mode, ready]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, colorScheme, colors: Colors[colorScheme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside ThemePreferenceProvider.');
  return value;
}