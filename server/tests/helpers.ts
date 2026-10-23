/**
 * Shared helpers for the test suites: a fresh demo dataset and a CSRF-aware
 * supertest agent.
 */
import request from "supertest";
import type { Express } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

export interface TestData {
  adminId: string;
  teacherAId: string; // teaches classA
  teacherBId: string; // teaches classB
  parentAId: string;
  parentBId: string;
  classAId: string;
  classBId: string;
  studentAId: string; // child of parentA, in classA (teacherA)
  studentBId: string; // child of parentB, in classB (teacherB)
  testInClassAId: string;
}

export const PASSWORD = "Password123";

/** Resets the test DB and creates a minimal two-class world. */
export async function seedTestData(): Promise<TestData> {
  // Order matters where FKs lack cascade
  await prisma.passwordResetToken.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.test.deleteMany();
  await prisma.application.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 4);

  const admin = await prisma.user.create({
    data: { email: "admin@test.local", passwordHash, role: "ADMIN" },
  });

  const teacherAUser = await prisma.user.create({
    data: {
      email: "teachera@test.local",
      passwordHash,
      role: "TEACHER",
      teacher: { create: { fullName: "Teacher A" } },
    },
    include: { teacher: true },
  });
  const teacherBUser = await prisma.user.create({
    data: {
      email: "teacherb@test.local",
      passwordHash,
      role: "TEACHER",
      teacher: { create: { fullName: "Teacher B" } },
    },
    include: { teacher: true },
  });

  const classA = await prisma.classroom.create({
    data: { name: "Class A", program: "LKG", teacherId: teacherAUser.teacher!.id },
  });
  const classB = await prisma.classroom.create({
    data: { name: "Class B", program: "UKG", teacherId: teacherBUser.teacher!.id },
  });

  const parentAUser = await prisma.user.create({
    data: {
      email: "parenta@test.local",
      passwordHash,
      role: "PARENT",
      parent: {
        create: {
          fullName: "Parent A",
          phone: "+1 555 0001",
          address: "1 Alpha Street",
          emergencyContact: "+1 555 0009",
        },
      },
    },
    include: { parent: true },
  });
  const parentBUser = await prisma.user.create({
    data: {
      email: "parentb@test.local",
      passwordHash,
      role: "PARENT",
      parent: {
        create: {
          fullName: "Parent B",
          phone: "+1 555 0002",
          address: "2 Beta Street",
          emergencyContact: "+1 555 0008",
        },
      },
    },
    include: { parent: true },
  });

  const studentA = await prisma.student.create({
    data: {
      fullName: "Child A",
      dob: new Date("2022-01-01"),
      gender: "FEMALE",
      program: "LKG",
      classroomId: classA.id,
      parentId: parentAUser.parent!.id,
    },
  });
  const studentB = await prisma.student.create({
    data: {
      fullName: "Child B",
      dob: new Date("2021-01-01"),
      gender: "MALE",
      program: "UKG",
      classroomId: classB.id,
      parentId: parentBUser.parent!.id,
    },
  });

  const testInClassA = await prisma.test.create({
    data: {
      title: "Alphabet Quiz",
      subject: "Language",
      date: new Date("2026-01-15"),
      maxMarks: 20,
      term: "TERM1",
      academicYear: "2025-26",
      classroomId: classA.id,
      createdById: admin.id,
    },
  });

  // A result + progress report so parents have data to read
  await prisma.testResult.create({
    data: { testId: testInClassA.id, studentId: studentA.id, marksObtained: 18, grade: "A" },
  });
  await prisma.progressReport.create({
    data: {
      studentId: studentA.id,
      teacherId: teacherAUser.teacher!.id,
      term: "TERM1",
      academicYear: "2025-26",
      attendancePct: 95,
      languageRating: 5,
      mathRating: 4,
      motorRating: 5,
      socialRating: 4,
      creativityRating: 5,
      disciplineRating: 4,
      teacherRemarks: "Wonderful progress!",
    },
  });

  return {
    adminId: admin.id,
    teacherAId: teacherAUser.teacher!.id,
    teacherBId: teacherBUser.teacher!.id,
    parentAId: parentAUser.parent!.id,
    parentBId: parentBUser.parent!.id,
    classAId: classA.id,
    classBId: classB.id,
    studentAId: studentA.id,
    studentBId: studentB.id,
    testInClassAId: testInClassA.id,
  };
}

/** Extracts the CSRF cookie value from a response's Set-Cookie headers. */
export function csrfFrom(res: request.Response): string {
  const setCookies: string[] = res.headers["set-cookie"] ?? [];
  for (const c of setCookies) {
    const match = c.match(/ls_csrf_token=([^;]+)/);
    if (match) return match[1];
  }
  throw new Error("No CSRF cookie found in response");
}

/** An agent that automatically fetches and echoes the CSRF token. */
export function csrfAgent(app: Express) {
  const agent = request.agent(app);
  let token = "";

  const wrap = (req: request.Test): request.Test => {
    // Attach the CSRF header to state-changing requests
    return req.set("x-csrf-token", token) as request.Test;
  };

  return {
    async seed() {
      const res = await agent.get("/api/health");
      token = csrfFrom(res);
      return this;
    },
    get(path: string) {
      return agent.get(path);
    },
    post(path: string) {
      return wrap(agent.post(path));
    },
    patch(path: string) {
      return wrap(agent.patch(path));
    },
    put(path: string) {
      return wrap(agent.put(path));
    },
    delete(path: string) {
      return wrap(agent.delete(path));
    },
    agent,
  };
}

/** Logs in and returns the authenticated agent + CSRF token. */
export async function loginAgent(app: Express, email: string, password: string) {
  const agent = csrfAgent(app);
  await agent.seed();
  const res = await agent.post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body.user as { id: string; email: string; role: string } };
}
