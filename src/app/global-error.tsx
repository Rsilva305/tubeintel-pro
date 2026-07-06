'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
        </div>
      </body>
    </html>
  );
}
