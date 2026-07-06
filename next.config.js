const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required on Next 14 for instrumentation.ts register() to run (default in Next 15+)
  experimental: {
    instrumentationHook: true,
  },

  compiler: {
    // Strip console.log/debug/info from production builds; keep error and warn
    // so server logs and Sentry breadcrumbs still work. Dev keeps everything.
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print Sentry build logs when uploading source maps
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Route browser error reports through your own domain so ad blockers
  // don't drop them before they reach Sentry
  tunnelRoute: '/monitoring',

  // Hide source maps from the deployed client bundle
  hideSourceMaps: true,

  disableLogger: true,
});
