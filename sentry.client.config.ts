import * as Sentry from '@sentry/nextjs';

const isProd = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Full tracing in dev, sampled in production to control cost
  tracesSampleRate: isProd ? 0.1 : 1.0,

  // Record a session replay on 10% of sessions, and always when an error occurs
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  enabled: isProd || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
