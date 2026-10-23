import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env, isTest } from "../config/env";
import { ApiError } from "../lib/errors";

export const CSRF_COOKIE = "ls_csrf_token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * In tests CSRF is skipped by default for simpler fixtures; the security test
 * suite re-enables enforcement with ENABLE_SECURITY_TESTS=true.
 */
const skipCsrf = () => isTest && process.env.ENABLE_SECURITY_TESTS !== "true";

/**
 * Double-submit cookie CSRF protection.
 * A readable CSRF cookie is issued on every response; clients must echo it
 * back in the x-csrf-token header on state-changing requests.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (typeof token !== "string" || token.length < 16) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // must be readable by the JS client
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  if (SAFE_METHODS.has(req.method) || skipCsrf()) return next();

  const sent = req.headers[CSRF_HEADER];
  if (typeof sent !== "string" || sent.length === 0 || sent !== token) {
    throw ApiError.forbidden("Invalid or missing CSRF token");
  }
  next();
}
