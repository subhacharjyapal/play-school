import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError, asyncHandler } from "../../lib/errors";
import { logger } from "../../lib/logger";
import {
  hashPassword,
  verifyPassword,
  generateResetToken,
  hashToken,
  RESET_TOKEN_TTL_MS,
} from "../../services/auth.service";
import { getEmailService, appBaseUrl } from "../../services/email.service";
import {
  setAuthCookie,
  clearAuthCookie,
  signAccessToken,
} from "../../middleware/auth";
import type { LoginInput } from "./auth.schemas";

const safeUser = (u: { id: string; email: string; role: string }) => ({
  id: u.id,
  email: u.email,
  role: u.role,
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    logger.warn("Failed login attempt", { userId: user.id });
    throw ApiError.unauthorized("Invalid email or password");
  }

  const authUser = safeUser(user);
  setAuthCookie(res, signAccessToken({ ...authUser, role: authUser.role as never }));
  logger.info("User logged in", { userId: user.id, role: user.role });
  res.json({ user: authUser });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      parent: { select: { id: true, fullName: true, phone: true } },
      teacher: { select: { id: true, fullName: true } },
    },
  });
  if (!dbUser) throw ApiError.unauthorized();
  res.json({ user: dbUser });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const user = await prisma.user.findUnique({ where: { email } });

  // Always answer the same way to avoid revealing which emails exist.
  if (user) {
    const { rawToken, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const link = `${appBaseUrl()}/reset-password?token=${rawToken}`;
    await getEmailService().send({
      to: user.email,
      subject: "Reset your Little Stars Play School password",
      text: [
        "Hello,",
        "",
        "Someone requested a password reset for your parent portal account.",
        `If it was you, open this link within 1 hour to set a new password:`,
        "",
        link,
        "",
        "If you did not request this, you can safely ignore this email.",
        "",
        "Little Stars Play School",
      ].join("\n"),
    });
  }

  res.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };

  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(token), usedAt: null },
  });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest("This reset link is invalid or has expired. Please request a new one.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info("Password reset completed", { userId: record.userId });
  res.json({ message: "Password updated. You can now log in with your new password." });
});
