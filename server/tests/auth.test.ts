/**
 * Auth suite: login, session, logout, password reset flow.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { seedTestData, loginAgent, csrfFrom, PASSWORD, type TestData } from "./helpers";

const app = createApp();

let data: TestData;

beforeAll(async () => {
  data = await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials and sets an httpOnly cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "parenta@test.local", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("PARENT");
    expect(res.body.user.email).toBe("parenta@test.local");

    const cookie = (res.headers["set-cookie"] as string[]).find((c) =>
      c.startsWith("ls_access_token=")
    );
    expect(cookie).toBeDefined();
    expect(cookie!.toLowerCase()).toContain("httponly");
  });

  it("rejects a wrong password with a generic message (no user enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "parenta@test.local", password: "WrongPass123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");

    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password: "WrongPass123" });
    expect(unknown.status).toBe(401);
    // Identical message for unknown email vs wrong password
    expect(unknown.body.error).toBe(res.body.error);
  });

  it("rejects malformed payloads with validation errors", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  it("rejects deactivated accounts", async () => {
    await prisma.user.update({
      where: { email: "teacherb@test.local" },
      data: { isActive: false },
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacherb@test.local", password: PASSWORD });
    expect(res.status).toBe(401);

    await prisma.user.update({
      where: { email: "teacherb@test.local" },
      data: { isActive: true },
    });
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the session user with a valid cookie", async () => {
    const { agent, user } = await loginAgent(app, "parenta@test.local", PASSWORD);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.role).toBe("PARENT");
  });

  it("returns 401 for a tampered/forged token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "ls_access_token=eyJhbGciOiJIUzI1NiJ9.forged.signature");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const { agent } = await loginAgent(app, "parenta@test.local", PASSWORD);
    const res = await agent.post("/api/auth/logout");
    expect(res.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401); // the agent dropped the cleared cookie — logout worked
    // …and the cleared cookie value itself proves the cookie was emptied:
    const cleared = (res.headers["set-cookie"] as string[]).find((c) =>
      c.startsWith("ls_access_token=")
    );
    expect(cleared).toBeDefined();
    expect(cleared).toMatch(/ls_access_token=;/);
  });
});

describe("Password reset flow", () => {
  it("responds the same for known and unknown emails (no enumeration)", async () => {
    const known = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "parenta@test.local" });
    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ghost@test.local" });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it("resets the password with a valid token, and rejects reuse", async () => {
    // Create a reset token directly (mirrors what the endpoint does)
    const crypto = await import("crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await prisma.user.findUnique({ where: { email: "parentb@test.local" } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user!.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, password: "BrandNew123" });
    expect(reset.status).toBe(200);

    // Old password no longer works; new one does
    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "parentb@test.local", password: PASSWORD });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "parentb@test.local", password: "BrandNew123" });
    expect(newLogin.status).toBe(200);

    // Token cannot be reused
    const reuse = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, password: "Another123" });
    expect(reuse.status).toBe(400);

    // Restore original password for other suites
    await prisma.user.update({
      where: { email: "parentb@test.local" },
      data: {
        passwordHash: await (
          await import("bcryptjs")
        ).default.hash(PASSWORD, 4),
      },
    });
  });

  it("rejects expired tokens", async () => {
    const crypto = await import("crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await prisma.user.findUnique({ where: { email: "parenta@test.local" } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user!.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    });
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, password: "Whatever123" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/csrf cookie issuance", () => {
  it("issues a readable CSRF cookie on safe requests", async () => {
    const res = await request(app).get("/api/health");
    const token = csrfFrom(res);
    expect(token.length).toBeGreaterThanOrEqual(32);
  });
});
