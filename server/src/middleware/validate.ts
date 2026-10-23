import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../lib/errors";

/**
 * Validates req.body / req.params / req.query with Zod schemas.
 * On failure throws 400 with per-field messages.
 */
export function validate(schemas: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(sanitizeInput(req.body));
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        req.params = parsed as typeof req.params;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // express 5 makes req.query a getter; assign via Object.assign fallback
        Object.assign(req, { query: parsed });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw ApiError.badRequest("Validation failed", details);
      }
      next(err);
    }
  };
}

/** Trim strings and strip control characters — basic sanitization for text input. */
export function sanitizeInput<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim() as unknown as T;
  }
  if (Array.isArray(value)) return value.map(sanitizeInput) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeInput(v);
    }
    return out as T;
  }
  return value;
}
