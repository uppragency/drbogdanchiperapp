import * as Sentry from "@sentry/nextjs";

// Error reporting is active only when NEXT_PUBLIC_SENTRY_DSN is set. No personal data, no performance traces, no replays.
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, tracesSampleRate: 0, environment: process.env.VERCEL_ENV ?? "development" });
}

export const onRequestError = Sentry.captureRequestError;
