import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ApiError, asyncHandler } from "../../lib/errors";
import { requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { PROGRAMS, ROLES } from "../../lib/constants";
import { hashPassword } from "../../services/auth.service";
import crypto from "crypto";

const router = Router();
router.use(requireRole("ADMIN"));

// ---------- Dashboard stats ----------

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [students, pendingApps, teachers, parents, classes, messages] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.classroom.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);
    res.json({ students, pendingApps, teachers, parents, classes, messages });
  })
);

// ---------- Students ----------

const studentSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  dob: z.coerce.date().refine((d) => d.getTime() < Date.now(), "DOB must be in the past"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  program: z.enum(PROGRAMS),
  classroomId: z.string().optional().or(z.literal("")),
  parentId: z.string().min(1),
  photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

router.get(
  "/students",
  validate({ query: z.object({ q: z.string().optional(), classroomId: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const { q, classroomId } = req.query as { q?: string; classroomId?: string };
    const students = await prisma.student.findMany({
      where: {
        ...(q
          ? { fullName: { contains: q } }
          : {}),
        ...(classroomId ? { classroomId } : {}),
      },
      include: {
        parent: { select: { id: true, fullName: true, phone: true } },
        classroom: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    });
    res.json({ students });
  })
);

router.post(
  "/students",
  validate({ body: studentSchema }),
  asyncHandler(async (req, res) => {
    const { fullName, dob, gender, program, classroomId, parentId, photoUrl } = req.body;
    const parent = await prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) throw ApiError.badRequest("Parent not found");
    if (classroomId) {
      const cls = await prisma.classroom.findUnique({ where: { id: classroomId } });
      if (!cls) throw ApiError.badRequest("Class not found");
    }
    const student = await prisma.student.create({
      data: {
        fullName,
        dob,
        gender,
        program,
        classroomId: classroomId || null,
        parentId,
        photoUrl: photoUrl || null,
      },
    });
    res.status(201).json({ student });
  })
);

router.patch(
  "/students/:id",
  validate({ body: studentSchema.partial() }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Student not found");
    const d = req.body;
    const student = await prisma.student.update({
      where: { id: existing.id },
      data: {
        ...(d.fullName !== undefined && { fullName: d.fullName }),
        ...(d.dob !== undefined && { dob: d.dob }),
        ...(d.gender !== undefined && { gender: d.gender }),
        ...(d.program !== undefined && { program: d.program }),
        ...(d.classroomId !== undefined && { classroomId: d.classroomId || null }),
        ...(d.parentId !== undefined && { parentId: d.parentId }),
        ...(d.photoUrl !== undefined && { photoUrl: d.photoUrl || null }),
      },
    });
    res.json({ student });
  })
);

// Archive (soft delete) — never hard-delete children's records
router.post(
  "/students/:id/archive",
  asyncHandler(async (req, res) => {
    const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Student not found");
    const student = await prisma.student.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    res.json({ student });
  })
);

// ---------- Parents ----------

router.get(
  "/parents",
  asyncHandler(async (_req, res) => {
    const parents = await prisma.parent.findMany({
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        students: { select: { id: true, fullName: true, isActive: true } },
      },
      orderBy: { fullName: "asc" },
    });
    res.json({ parents });
  })
);

// ---------- Teachers ----------

const teacherSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  qualification: z.string().trim().max(200).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

router.get(
  "/teachers",
  asyncHandler(async (_req, res) => {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        classrooms: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    });
    res.json({ teachers });
  })
);

function generatePassword(): string {
  return `Ts${crypto.randomInt(100000, 999999)}!`;
}

router.post(
  "/teachers",
  validate({ body: teacherSchema }),
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, qualification, bio, photoUrl } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("A user with this email already exists");

    const tempPassword = generatePassword();
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(tempPassword),
        role: "TEACHER",
        teacher: {
          create: {
            fullName,
            phone: phone || null,
            qualification: qualification || null,
            bio: bio || null,
            photoUrl: photoUrl || null,
          },
        },
      },
      include: { teacher: true },
    });

    res.status(201).json({
      teacher: user.teacher,
      // Shown once to the admin so they can share it with the teacher
      temporaryPassword: tempPassword,
    });
  })
);

router.patch(
  "/teachers/:id",
  validate({ body: teacherSchema.partial() }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Teacher not found");
    const d = req.body;
    const teacher = await prisma.teacher.update({
      where: { id: existing.id },
      data: {
        ...(d.fullName !== undefined && { fullName: d.fullName }),
        ...(d.phone !== undefined && { phone: d.phone || null }),
        ...(d.qualification !== undefined && { qualification: d.qualification || null }),
        ...(d.bio !== undefined && { bio: d.bio || null }),
        ...(d.photoUrl !== undefined && { photoUrl: d.photoUrl || null }),
      },
    });
    res.json({ teacher });
  })
);

router.post(
  "/teachers/:id/toggle-active",
  asyncHandler(async (req, res) => {
    const existing = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!existing) throw ApiError.notFound("Teacher not found");
    const user = await prisma.user.update({
      where: { id: existing.userId },
      data: { isActive: !existing.user.isActive },
    });
    res.json({ isActive: user.isActive });
  })
);

// ---------- Classes ----------

const classSchema = z.object({
  name: z.string().trim().min(2).max(80),
  program: z.enum(PROGRAMS),
  teacherId: z.string().optional().or(z.literal("")),
});

router.get(
  "/classes",
  asyncHandler(async (_req, res) => {
    const classes = await prisma.classroom.findMany({
      include: {
        teacher: { select: { id: true, fullName: true } },
        _count: { select: { students: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    });
    res.json({ classes });
  })
);

router.post(
  "/classes",
  validate({ body: classSchema }),
  asyncHandler(async (req, res) => {
    const { name, program, teacherId } = req.body;
    if (teacherId) {
      const t = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (!t) throw ApiError.badRequest("Teacher not found");
    }
    const classroom = await prisma.classroom.create({
      data: { name, program, teacherId: teacherId || null },
    });
    res.status(201).json({ classroom });
  })
);

router.patch(
  "/classes/:id",
  validate({ body: classSchema.partial() }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.classroom.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Class not found");
    const d = req.body;
    const classroom = await prisma.classroom.update({
      where: { id: existing.id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.program !== undefined && { program: d.program }),
        ...(d.teacherId !== undefined && { teacherId: d.teacherId || null }),
      },
    });
    res.json({ classroom });
  })
);

export default router;
