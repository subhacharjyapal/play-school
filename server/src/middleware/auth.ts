import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { ApiError, asyncHandler } from "../lib/errors";

export const ACCESS_COOKIE = "ls_access_token";

export type AuthUser = {
  id: string;
  email: string;
  role: "PARENT" | "TEACHER" | "ADMIN";
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // matches JWT_EXPIRES_IN default of 7d
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
  });
}

function extractToken(req: Request): string | null {
  const cookie = req.cookies?.[ACCESS_COOKIE];
  if (typeof cookie === "string" && cookie.length > 0) return cookie;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7); // useful for tests/tools
  return null;
}

/** Requires a valid JWT and an active user. */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized();

    let payload: { sub?: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
    } catch {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }
    if (!payload.sub) throw ApiError.unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) throw ApiError.unauthorized();

    req.user = { id: user.id, email: user.email, role: user.role as AuthUser["role"] };
    next();
  }
);

/** Requires authentication plus one of the given roles. */
export function requireRole(...roles: AuthUser["role"][]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    await new Promise<void>((resolve, reject) => {
      requireAuth(req, _res, (err?: unknown) => (err ? reject(err) : resolve()));
    });
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden();
    }
    next();
  });
}
