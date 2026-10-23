import { env, isProd } from "../config/env";
import { logger } from "../lib/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Dev/test email service: logs the email (recipient + subject) to the console.
 * The email body may contain a password-reset link or demo credentials, which
 * are fine to show in dev but are redacted from structured logs elsewhere.
 */
export class ConsoleEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    logger.info("EMAIL (console mock)", { to: message.to, subject: message.subject });
    // Print the human-readable content so devs can grab reset links/credentials.
    console.log(
      [
        "─────────────── [MOCK EMAIL] ───────────────",
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
        "────────────────────────────────────────────",
      ].join("\n")
    );
  }
}

/** Production email service using Nodemailer (activated when SMTP_HOST is set). */
export class NodemailerEmailService implements EmailService {
  private transporter: import("nodemailer").Transporter;

  constructor() {
    // Lazy require so dev setups without SMTP never load nodemailer.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer");
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({ from: env.EMAIL_FROM, ...message });
    logger.info("EMAIL sent", { to: message.to, subject: message.subject });
  }
}

let instance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!instance) {
    instance = env.SMTP_HOST ? new NodemailerEmailService() : new ConsoleEmailService();
  }
  return instance;
}

/** For tests. */
export function setEmailService(service: EmailService | null) {
  instance = service;
}

export function appBaseUrl(): string {
  return isProd ? "https://example.com" : "http://localhost:5173";
}
