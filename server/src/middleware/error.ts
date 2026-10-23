import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/errors";
import { logger } from "../lib/logger";
import { isProd } from "../config/env";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Multer file-size error
  if (err && typeof err === "object" && (err as { code?: string }).code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File is too large" });
  }

  // Prisma unique-constraint error
  if (err && typeof err === "object" && (err as { code?: string }).code === "P2002") {
    return res.status(409).json({ error: "A record with this information already exists" });
  }

  // Prisma record-not-found error
  if (err && typeof err === "object" && (err as { code?: string }).code === "P2025") {
    return res.status(404).json({ error: "Resource not found" });
  }

  // Multer file-type rejection
  if (err instanceof Error && err.message.includes("are allowed")) {
    return res.status(400).json({ error: err.message });
  }

  logger.error("Unhandled error", {
    message: err instanceof Error ? err.message : String(err),
    stack: isProd ? undefined : err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({ error: "Something went wrong. Please try again." });
}
