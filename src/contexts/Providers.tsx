'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { MetricsProvider } from './MetricsContext';
import { SubscriptionProvider } from './SubscriptionContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SubscriptionProvider>
          <MetricsProvider>
            {children}
          </MetricsProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
} 