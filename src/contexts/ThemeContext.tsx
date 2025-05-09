'use client';

/**
 * Theme Context for TubeIntel Pro
 * Provides dark mode functionality throughout the application
 * This version enforces permanent dark mode across the entire site
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';

type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always use dark theme
  const theme: Theme = 'dark';

  // Apply dark theme class to document on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Always set theme to dark in localStorage
      localStorage.setItem('theme', 'dark');
      // Always add dark class to document
      document.documentElement.classList.add('dark');
    }
  }, []);

  const value = {
    theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 