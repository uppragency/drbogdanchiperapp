import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {};

// Source map upload happens only when SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT are set in Vercel.
export default withSentryConfig(nextConfig, { silent: true, telemetry: false, sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN } });
