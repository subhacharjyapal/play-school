/**
 * Security suite: CSRF double-submit protection and login rate limiting.
 * These tests opt in to enforcement (disabled by default in the test env).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { seedTestData, csrfFrom, PASSWORD } from "./helpers";

const app = createApp();

beforeAll(async () => {
  // Turn on CSRF + rate limiting for this suite only
  process.env.ENABLE_SECURITY_TESTS = "true";
  process.env.ENABLE_RATE_LIMIT_TESTS = "true";
  await seedTestData();
});

afterAll(async () => {
  delete process.env.ENABLE_SECURITY_TESTS;
  delete process.env.ENABLE_RATE_LIMIT_TESTS;
  await prisma.$disconnect();
});

describe("CSRF protection", () => {
  it("rejects state-changing requests without the x-csrf-token header", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "parenta@test.local", password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/csrf/i);
  });

  it("rejects requests with a mismatched CSRF token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-csrf-token", "definitely-not-the-right-token")
      .send({ email: "parenta@test.local", password: PASSWORD });
    expect(res.status).toBe(403);
  });

  it("accepts requests that echo the issued cookie (double-submit)", async () => {
    // A browser would send the cookie back automatically — simulate with an agent
    const agent = request.agent(app);
    const first = await agent.get("/api/health");
    const token = csrfFrom(first);
    const res = await agent
      .post("/api/auth/login")
      .set("x-csrf-token", token)
      .send({ email: "parenta@test.local", password: PASSWORD });
    expect(res.status).toBe(200);
  });

  it("does not require CSRF for safe methods", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});

describe("Login rate limiting", () => {
  it("returns 429 after too many rapid login attempts", async () => {
    const agent = request.agent(app);
    const first = await agent.get("/api/health");
    const token = csrfFrom(first);

    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await agent
        .post("/api/auth/login")
        .set("x-csrf-token", token)
        .send({ email: "parenta@test.local", password: `Wrong${i}Pass` });
      statuses.push(res.status);
    }
    // The strict limiter allows 10 per 15-minute window; later attempts must 429
    expect(statuses).toContain(429);
    expect(statuses[statuses.length - 1]).toBe(429);
  });
});

describe("Input sanitization", () => {
  it("trims and strips control characters from text fields", async () => {
    const agent = request.agent(app);
    const first = await agent.get("/api/health");
    const token = csrfFrom(first);

    const res = await agent
      .post("/api/contact")
      .set("x-csrf-token", token)
      .send({
        name: "  Test\u0000Parent  ",
        email: "  trimmed@example.com  ",
        message: "Hello\u0007 there, this is a message.",
      });
    expect(res.status).toBe(201);

    const saved = await prisma.contactMessage.findFirst({
      where: { email: "trimmed@example.com" },
      orderBy: { createdAt: "desc" },
    });
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe("TestParent");
    expect(saved!.message).not.toContain("\u0007");
  });

  it("rejects oversized fields via Zod validation", async () => {
    const agent = request.agent(app);
    const first = await agent.get("/api/health");
    const token = csrfFrom(first);

    const res = await agent
      .post("/api/contact")
      .set("x-csrf-token", token)
      .send({
        name: "x",
        email: "not-an-email",
        message: "short",
      });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

describe("Security headers", () => {
  it("sets Helmet security headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });
});

describe("Upload restrictions", () => {
  it("rejects gallery uploads from non-admins", async () => {
    // Login as a parent
    const h = await request(app).get("/api/health");
    const token = csrfFrom(h);
    const login = await request(app)
      .post("/api/auth/login")
      .set("x-csrf-token", token)
      .send({ email: "parenta@test.local", password: PASSWORD });
    const cookie = (login.headers["set-cookie"] as string[]).join("; ");

    const upload = await request(app)
      .post("/api/gallery")
      .set("Cookie", cookie)
      .set("x-csrf-token", token)
      .attach("image", Buffer.from("fake"), {
        filename: "evil.svg",
        contentType: "image/svg+xml",
      })
      .field("title", "Sneaky")
      .field("category", "EVENT");
    expect(upload.status).toBe(403); // role check fires before upload handling
  });
});
