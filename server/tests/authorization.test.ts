/**
 * Authorization suite: proves that a parent can ONLY access their own
 * children's data, and that role boundaries hold on the server side.
 * (The UI is never trusted for these decisions.)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { seedTestData, loginAgent, PASSWORD, type TestData } from "./helpers";

const app = createApp();
let data: TestData;

beforeAll(async () => {
  data = await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Parent data ownership", () => {
  it("parent A sees only their own children", async () => {
    const { agent } = await loginAgent(app, "parenta@test.local", PASSWORD);
    const res = await agent.get("/api/children");
    expect(res.status).toBe(200);
    expect(res.body.children).toHaveLength(1);
    expect(res.body.children[0].id).toBe(data.studentAId);
    expect(res.body.children[0].fullName).toBe("Child A");
  });

  it("parent A is DENIED parent B's child progress", async () => {
    const { agent } = await loginAgent(app, "parenta@test.local", PASSWORD);
    const res = await agent.get(`/api/students/${data.studentBId}/progress`);
    expect(res.status).toBe(403);
  });

  it("parent A is DENIED parent B's child test results", async () => {
    const { agent } = await loginAgent(app, "parenta@test.local", PASSWORD);
    const res = await agent.get(`/api/students/${data.studentBId}/results`);
    expect(res.status).toBe(403);
  });

  it("parent A is DENIED parent B's report card PDF", async () => {
    const { agent } = await loginAgent(app, "parenta@test.local", PASSWORD);
    const res = await agent.get(`/api/students/${data.studentBId}/report-card`);
    expect(res.status).toBe(403);
  });

  it("parent B can read their own child (positive control)", async () => {
    const { agent } = await loginAgent(app, "parentb@test.local", PASSWORD);
    const res = await agent.get(`/api/students/${data.studentBId}/results`);
    expect(res.status).toBe(200);
  });

  it("anonymous users are denied (401) on portal data", async () => {
    const request = (await import("supertest")).default;
    for (const path of [
      "/api/children",
      `/api/students/${data.studentAId}/progress`,
      `/api/students/${data.studentAId}/results`,
      `/api/students/${data.studentAId}/report-card`,
      "/api/profile",
    ]) {
      const res = await request(app).get(path);
      expect(res.status, `${path} should be 401`).toBe(401);
    }
  });

  it("parents cannot update each other's profile (only their own exists)", async () => {
    const { agent } = await loginAgent(app, "parenta@test.local", PASSWORD);
    // There is no path param here — the server resolves the profile from the
    // session user, so this asserts the endpoint exists and validates input.
    const bad = await agent.patch("/api/profile").send({ fullName: "X" });
    expect(bad.status).toBe(400); // validation error, not another parent's data
  });
});

describe("Teacher scope", () => {
  it("teacher A sees only their class's students", async () => {
    const { agent } = await loginAgent(app, "teachera@test.local", PASSWORD);
    const res = await agent.get("/api/teacher/overview");
    expect(res.status).toBe(200);
    expect(res.body.classrooms).toHaveLength(1);
    expect(res.body.classrooms[0].id).toBe(data.classAId);
    const ids = res.body.classrooms[0].students.map((s: { id: string }) => s.id);
    expect(ids).toContain(data.studentAId);
    expect(ids).not.toContain(data.studentBId);
  });

  it("teacher A can record results for their own student", async () => {
    const { agent } = await loginAgent(app, "teachera@test.local", PASSWORD);
    const res = await agent
      .put(`/api/teacher/tests/${data.testInClassAId}/results`)
      .send({ studentId: data.studentAId, marksObtained: 19, remarks: "Great" });
    expect(res.status).toBe(200);
    expect(res.body.result.grade).toBe("A+"); // 19/20 = 95% >= 90 → A+
  });

  it("teacher B is DENIED writing results for teacher A's test", async () => {
    const { agent } = await loginAgent(app, "teacherb@test.local", PASSWORD);
    const res = await agent
      .put(`/api/teacher/tests/${data.testInClassAId}/results`)
      .send({ studentId: data.studentAId, marksObtained: 1 });
    expect(res.status).toBe(403);
  });

  it("teacher B is DENIED writing progress for teacher A's student", async () => {
    const { agent } = await loginAgent(app, "teacherb@test.local", PASSWORD);
    const res = await agent.put("/api/teacher/progress").send({
      studentId: data.studentAId,
      term: "TERM1",
      academicYear: "2025-26",
      attendancePct: 50,
      languageRating: 1,
      mathRating: 1,
      motorRating: 1,
      socialRating: 1,
      creativityRating: 1,
      disciplineRating: 1,
    });
    expect(res.status).toBe(403);
  });

  it("teacher B is DENIED attendance for teacher A's class", async () => {
    const { agent } = await loginAgent(app, "teacherb@test.local", PASSWORD);
    const res = await agent.post("/api/teacher/attendance").send({
      classroomId: data.classAId,
      date: "2026-02-01",
      records: [{ studentId: data.studentAId, status: "PRESENT" }],
    });
    expect(res.status).toBe(403);
  });

  it("teacher cannot create a test for a class they do not teach", async () => {
    const { agent } = await loginAgent(app, "teacherb@test.local", PASSWORD);
    const res = await agent.post("/api/teacher/tests").send({
      title: "Sneaky test",
      subject: "Math",
      date: "2026-02-01",
      maxMarks: 10,
      term: "TERM1",
      academicYear: "2025-26",
      classroomId: data.classAId,
    });
    expect(res.status).toBe(403);
  });

  it("teachers cannot reach admin endpoints", async () => {
    const { agent } = await loginAgent(app, "teachera@test.local", PASSWORD);
    for (const path of [
      "/api/admin/stats",
      "/api/admin/students",
      "/api/admin/parents",
      "/api/admin/teachers",
      "/api/admin/classes",
    ]) {
      const res = await agent.get(path);
      expect(res.status, `${path} should be 403 for teachers`).toBe(403);
    }
  });
});

describe("Admin oversight", () => {
  it("admin can read any student's data (support role)", async () => {
    const { agent } = await loginAgent(app, "admin@test.local", PASSWORD);
    const progress = await agent.get(`/api/students/${data.studentAId}/progress`);
    expect(progress.status).toBe(200);
    const results = await agent.get(`/api/students/${data.studentBId}/results`);
    expect(results.status).toBe(200);
  });

  it("admin sees all students and stats", async () => {
    const { agent } = await loginAgent(app, "admin@test.local", PASSWORD);
    const students = await agent.get("/api/admin/students");
    expect(students.body.students).toHaveLength(2);
    const stats = await agent.get("/api/admin/stats");
    expect(stats.body.students).toBe(2);
  });

  it("parents and teachers cannot reach admin applications", async () => {
    for (const email of ["parenta@test.local", "teachera@test.local"]) {
      const { agent } = await loginAgent(app, email, PASSWORD);
      const res = await agent.get("/api/applications");
      expect(res.status, `${email} should be 403`).toBe(403);
    }
  });

  it("parents cannot reach teacher endpoints", async () => {
    const { agent } = await loginAgent(app, "parenta@test.local", PASSWORD);
    const res = await agent.get("/api/teacher/overview");
    expect(res.status).toBe(403);
  });
});

describe("Application approval creates accounts", () => {
  it("admin approval creates a parent account + student and marks approved", async () => {
    const { agent } = await loginAgent(app, "admin@test.local", PASSWORD);

    // 1. Submit an application (public)
    const request = (await import("supertest")).default;
    const submitted = await request(app).post("/api/applications").send({
      childFullName: "New Kid",
      dob: "2022-05-05",
      gender: "FEMALE",
      program: "NURSERY",
      parentName: "New Parent",
      relationship: "Mother",
      phone: "+1 555 0100",
      email: "newparent@test.local",
      address: "9 New Street, Austin",
      emergencyContact: "+1 555 0101",
    });
    expect(submitted.status).toBe(201);
    const appId = submitted.body.application.id;

    // 2. Approve as admin
    const approve = await agent.post(`/api/applications/${appId}/approve`);
    expect(approve.status).toBe(200);

    // 3. Parent account exists and can log in
    const newUser = await prisma.user.findUnique({
      where: { email: "newparent@test.local" },
      include: { parent: { include: { students: true } } },
    });
    expect(newUser).not.toBeNull();
    expect(newUser!.role).toBe("PARENT");
    expect(newUser!.parent!.students).toHaveLength(1);
    expect(newUser!.parent!.students[0].fullName).toBe("New Kid");

    // 4. Application is linked to the student
    const app2 = await prisma.application.findUnique({ where: { id: appId } });
    expect(app2!.status).toBe("APPROVED");
    expect(app2!.studentId).toBe(newUser!.parent!.students[0].id);
  });

  it("rejects approval of an already-reviewed application", async () => {
    const { agent } = await loginAgent(app, "admin@test.local", PASSWORD);
    const existing = await prisma.application.findFirst({
      where: { status: "APPROVED" },
    });
    const res = await agent.post(`/api/applications/${existing!.id}/approve`);
    expect(res.status).toBe(409);
  });
});
