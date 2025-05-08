'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { MetricsProvider } from './MetricsContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MetricsProvider>
          {children}
        </MetricsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
} 