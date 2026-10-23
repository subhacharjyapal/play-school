import rateLimit from "express-rate-limit";
import { isTest } from "../config/env";

/**
 * DISABLE_RATE_LIMIT=true turns the limiters off — a dev convenience for
 * local testing/automation. Never set it in production.
 * In tests limiters are skipped by default; the security test suite re-enables
 * them with ENABLE_RATE_LIMIT_TESTS=true.
 */
const skipLimit = () =>
  (isTest && process.env.ENABLE_RATE_LIMIT_TESTS !== "true") ||
  process.env.DISABLE_RATE_LIMIT === "true";

const skipInTest = skipLimit;

/** Generous limiter applied to the whole API. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: "Too many requests. Please try again later." },
});

/** Strict limiter for credential-sensitive endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});
