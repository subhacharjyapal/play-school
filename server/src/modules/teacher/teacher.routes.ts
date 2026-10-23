import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ApiError, asyncHandler } from "../../lib/errors";
import { requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { getTeacherProfileId } from "../../services/ownership.service";
import { PROGRAMS, TERMS, ATTENDANCE_STATUSES } from "../../lib/constants";
import { computeGrade } from "../../lib/constants";

const router = Router();
router.use(requireRole("TEACHER", "ADMIN"));

/** Resolves the teacher profile for the current user (admin passes through). */
async function requireTeacherProfileId(userId: string): Promise<string> {
  const id = await getTeacherProfileId(userId);
  if (!id) throw ApiError.notFound("Teacher profile not found");
  return id;
}

/** Ensures a classroom belongs to this teacher (admins skip the check). */
async function assertClassroomAccess(user: { id: string; role: string }, classroomId: string) {
  if (user.role === "ADMIN") return;
  const teacherId = await requireTeacherProfileId(user.id);
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || classroom.teacherId !== teacherId) {
    throw ApiError.forbidden("This classroom is not assigned to you");
  }
}

// ---------- Overview ----------

router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const teacherId = user.role === "ADMIN" ? null : await requireTeacherProfileId(user.id);

    const classrooms = await prisma.classroom.findMany({
      where: teacherId ? { teacherId } : undefined,
      include: {
        students: {
          where: { isActive: true },
          select: {
            id: true,
            fullName: true,
            program: true,
            photoUrl: true,
            dob: true,
          },
          orderBy: { fullName: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        program: c.program,
        studentCount: c.students.length,
        students: c.students,
      })),
    });
  })
);

// ---------- Tests ----------

const testSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subject: z.string().trim().min(1).max(100),
  date: z.coerce.date(),
  maxMarks: z.coerce.number().int().positive().max(1000),
  term: z.enum(TERMS),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Format: 2025-26"),
  classroomId: z.string().min(1),
});

router.get(
  "/tests",
  validate({ query: z.object({ classroomId: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const teacherId = user.role === "ADMIN" ? null : await requireTeacherProfileId(user.id);
    const classroomId = (req.query as { classroomId?: string }).classroomId;

    if (classroomId) await assertClassroomAccess(user, classroomId);

    const tests = await prisma.test.findMany({
      where: {
        ...(classroomId ? { classroomId } : {}),
        ...(teacherId ? { classroom: { teacherId } } : {}),
      },
      include: {
        classroom: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
      orderBy: { date: "desc" },
    });

    res.json({ tests });
  })
);

router.post(
  "/tests",
  validate({ body: testSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { title, subject, date, maxMarks, term, academicYear, classroomId } = req.body;
    await assertClassroomAccess(user, classroomId);
    const test = await prisma.test.create({
      data: {
        title,
        subject,
        date,
        maxMarks,
        term,
        academicYear,
        classroomId,
        createdById: user.id,
      },
    });
    res.status(201).json({ test });
  })
);

router.put(
  "/tests/:id",
  validate({ body: testSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const existing = await prisma.test.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Test not found");
    await assertClassroomAccess(user, existing.classroomId);

    const { title, subject, date, maxMarks, term, academicYear, classroomId } = req.body;
    const test = await prisma.test.update({
      where: { id: existing.id },
      data: { title, subject, date, maxMarks, term, academicYear, classroomId },
    });
    res.json({ test });
  })
);

router.delete(
  "/tests/:id",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const existing = await prisma.test.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Test not found");
    await assertClassroomAccess(user, existing.classroomId);
    await prisma.test.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);

// ---------- Results ----------

const resultSchema = z.object({
  studentId: z.string().min(1),
  marksObtained: z.coerce.number().int().min(0),
  remarks: z.string().trim().max(500).optional().or(z.literal("")),
});

router.get(
  "/tests/:id/results",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        results: true,
        classroom: { include: { students: { where: { isActive: true }, orderBy: { fullName: "asc" } } } },
      },
    });
    if (!test) throw ApiError.notFound("Test not found");
    await assertClassroomAccess(user, test.classroomId);

    // Every student of the class gets a row (with an empty result if unmarked)
    const rows = test.classroom.students.map((s) => {
      const result = test.results.find((r) => r.studentId === s.id);
      return {
        studentId: s.id,
        studentName: s.fullName,
        photoUrl: s.photoUrl,
        marksObtained: result?.marksObtained ?? null,
        grade: result?.grade ?? null,
        remarks: result?.remarks ?? null,
      };
    });

    res.json({ test: { id: test.id, title: test.title, maxMarks: test.maxMarks }, rows });
  })
);

router.put(
  "/tests/:id/results",
  validate({ body: resultSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { classroom: { include: { students: true } } },
    });
    if (!test) throw ApiError.notFound("Test not found");
    await assertClassroomAccess(user, test.classroomId);

    const { studentId, marksObtained, remarks } = req.body;
    const inClass = test.classroom.students.some((s) => s.id === studentId);
    if (!inClass) throw ApiError.badRequest("That student is not in this class");

    if (marksObtained > test.maxMarks) {
      throw ApiError.badRequest(`Marks cannot exceed ${test.maxMarks}`);
    }

    const pct = test.maxMarks > 0 ? (marksObtained / test.maxMarks) * 100 : 0;
    const grade = computeGrade(pct);

    const result = await prisma.testResult.upsert({
      where: { testId_studentId: { testId: test.id, studentId } },
      create: { testId: test.id, studentId, marksObtained, grade, remarks: remarks || null },
      update: { marksObtained, grade, remarks: remarks || null },
    });
    res.json({ result });
  })
);

// ---------- Progress reports ----------

const rating = z.coerce.number().int().min(1).max(5);

const progressSchema = z.object({
  studentId: z.string().min(1),
  term: z.enum(TERMS),
  academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/, "Format: 2025-26"),
  attendancePct: z.coerce.number().min(0).max(100),
  languageRating: rating,
  mathRating: rating,
  motorRating: rating,
  socialRating: rating,
  creativityRating: rating,
  disciplineRating: rating,
  teacherRemarks: z.string().trim().max(1000).optional().or(z.literal("")),
});

router.put(
  "/progress",
  validate({ body: progressSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const {
      studentId, term, academicYear, attendancePct,
      languageRating, mathRating, motorRating, socialRating, creativityRating, disciplineRating,
      teacherRemarks,
    } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, classroom: { select: { teacherId: true } } },
    });
    if (!student) throw ApiError.notFound("Student not found");
    if (user.role === "TEACHER") {
      const teacherId = await requireTeacherProfileId(user.id);
      if (student.classroom?.teacherId !== teacherId) {
        throw ApiError.forbidden("That student is not in your class");
      }
    }

    const teacherRecordId =
      user.role === "TEACHER" ? await requireTeacherProfileId(user.id) : null;

    const report = await prisma.progressReport.upsert({
      where: {
        studentId_term_academicYear: { studentId, term, academicYear },
      },
      create: {
        studentId,
        teacherId: teacherRecordId,
        term,
        academicYear,
        attendancePct,
        languageRating, mathRating, motorRating, socialRating, creativityRating, disciplineRating,
        teacherRemarks: teacherRemarks || null,
      },
      update: {
        teacherId: teacherRecordId,
        attendancePct,
        languageRating, mathRating, motorRating, socialRating, creativityRating, disciplineRating,
        teacherRemarks: teacherRemarks || null,
      },
    });
    res.json({ report });
  })
);

// ---------- Attendance ----------

const attendanceSchema = z.object({
  classroomId: z.string().min(1),
  date: z.coerce.date(),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(ATTENDANCE_STATUSES),
      })
    )
    .min(1)
    .max(100),
});

router.post(
  "/attendance",
  validate({ body: attendanceSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { classroomId, date, records } = req.body as {
      classroomId: string;
      date: string;
      records: Array<{ studentId: string; status: string }>;
    };
    await assertClassroomAccess(user, classroomId);

    // Normalize to UTC midnight (date-only semantics)
    const day = new Date(date);
    day.setUTCHours(0, 0, 0, 0);

    const classStudents = await prisma.student.findMany({
      where: { classroomId },
      select: { id: true },
    });
    const validIds = new Set(classStudents.map((s) => s.id));
    if (records.some((r) => !validIds.has(r.studentId))) {
      throw ApiError.badRequest("One or more students do not belong to this class");
    }

    const results = await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date: day } },
          create: { studentId: r.studentId, date: day, status: r.status, markedById: user.id },
          update: { status: r.status, markedById: user.id },
        })
      )
    );
    res.json({ saved: results.length });
  })
);

/** Attendance for one student (used by teacher + parent views). */
router.get(
  "/students/:id/attendance",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      select: { classroom: { select: { teacherId: true } } },
    });
    if (!student) throw ApiError.notFound("Student not found");
    if (user.role === "TEACHER") {
      const teacherId = await requireTeacherProfileId(user.id);
      if (student.classroom?.teacherId !== teacherId) {
        throw ApiError.forbidden("That student is not in your class");
      }
    }
    const records = await prisma.attendance.findMany({
      where: { studentId: req.params.id },
      orderBy: { date: "desc" },
      take: 60,
    });
    res.json({ records });
  })
);

export default router;
