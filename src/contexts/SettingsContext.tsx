import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/constants';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  setTheme: (theme: Settings['theme']) => void;
  setAccentColor: (color: string) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>('ums-settings', DEFAULT_SETTINGS);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  const setTheme = useCallback((theme: Settings['theme']) => {
    // Apply theme immediately using the passed theme value (not stale closure)
    applyTheme(theme);
    // Then update localStorage
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const setAccentColor = useCallback((color: string) => {
    updateSettings({ accentColor: color });
    document.documentElement.style.setProperty('--accent-color', color);
  }, [updateSettings]);

  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !settings.highContrast });
  }, [settings.highContrast, updateSettings]);

  const toggleReducedMotion = useCallback(() => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  }, [settings.reducedMotion, updateSettings]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings,
    setTheme,
    setAccentColor,
    toggleHighContrast,
    toggleReducedMotion,
  }), [settings, updateSettings, resetSettings, setTheme, setAccentColor, toggleHighContrast, toggleReducedMotion]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement;

  switch (theme) {
    case 'dark':
      root.classList.add('dark');
      root.classList.remove('light');
      break;
    case 'light':
      root.classList.remove('dark');
      root.classList.add('light');
      break;
    case 'system':
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
      break;
  }
}

export function initializeTheme(theme: Settings['theme']) {
  applyTheme(theme);

  if (theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
}
