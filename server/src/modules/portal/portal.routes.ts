import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError, asyncHandler } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  canUserAccessStudent,
  getParentProfile,
  getTeacherProfileId,
} from "../../services/ownership.service";
import { hashPassword, verifyPassword } from "../../services/auth.service";
import { changePasswordSchema, profileSchema } from "./portal.schemas";
import { logger } from "../../lib/logger";

const router = Router();
router.use(requireAuth);

/**
 * Lists children visible to the logged-in user:
 * - PARENT: their own children
 * - TEACHER: students in their assigned classrooms
 * - ADMIN: all active students
 */
router.get(
  "/children",
  asyncHandler(async (req, res) => {
    const user = req.user!;

    let where: { parentId?: string; classroom?: { teacherId?: string } } = { };

    if (user.role === "PARENT") {
      const parent = await getParentProfile(user.id);
      if (!parent) throw ApiError.notFound("Parent profile not found");
      where = { parentId: parent.id };
    } else if (user.role === "TEACHER") {
      const teacherId = await getTeacherProfileId(user.id);
      if (!teacherId) throw ApiError.notFound("Teacher profile not found");
      where = { classroom: { teacherId } };
    }

    const students = await prisma.student.findMany({
      where: { ...where, isActive: true },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        dob: true,
        gender: true,
        program: true,
        photoUrl: true,
        classroom: { select: { id: true, name: true, teacher: { select: { fullName: true } } } },
      },
    });

    res.json({
      children: students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        dob: s.dob,
        gender: s.gender,
        program: s.program,
        photoUrl: s.photoUrl,
        className: s.classroom?.name ?? null,
        teacherName: s.classroom?.teacher?.fullName ?? null,
      })),
    });
  })
);

/** Progress reports for one child (ownership-checked). */
router.get(
  "/students/:id/progress",
  asyncHandler(async (req, res) => {
    const allowed = await canUserAccessStudent(req.user!, req.params.id);
    if (!allowed) throw ApiError.forbidden("You do not have access to this student's data");

    const reports = await prisma.progressReport.findMany({
      where: { studentId: req.params.id },
      orderBy: { academicYear: "desc" },
      include: { teacher: { select: { fullName: true } } },
    });

    res.json({
      reports: reports.map((r) => ({
        id: r.id,
        term: r.term,
        academicYear: r.academicYear,
        attendancePct: r.attendancePct,
        ratings: {
          language: r.languageRating,
          math: r.mathRating,
          motor: r.motorRating,
          social: r.socialRating,
          creativity: r.creativityRating,
          discipline: r.disciplineRating,
        },
        teacherRemarks: r.teacherRemarks,
        teacherName: r.teacher?.fullName ?? null,
      })),
    });
  })
);

/** Test results for one child (ownership-checked), newest test first. */
router.get(
  "/students/:id/results",
  asyncHandler(async (req, res) => {
    const allowed = await canUserAccessStudent(req.user!, req.params.id);
    if (!allowed) throw ApiError.forbidden("You do not have access to this student's data");

    const results = await prisma.testResult.findMany({
      where: { studentId: req.params.id },
      include: {
        test: { select: { id: true, title: true, subject: true, date: true, maxMarks: true, term: true, academicYear: true } },
      },
      orderBy: { test: { date: "asc" } },
    });

    res.json({
      results: results.map((r) => ({
        id: r.id,
        testId: r.test.id,
        title: r.test.title,
        subject: r.test.subject,
        date: r.test.date,
        term: r.test.term,
        academicYear: r.test.academicYear,
        maxMarks: r.test.maxMarks,
        marksObtained: r.marksObtained,
        grade: r.grade,
        remarks: r.remarks,
        percentage: r.test.maxMarks > 0 ? Math.round((r.marksObtained / r.test.maxMarks) * 100) : 0,
      })),
    });
  })
);

/** Fetch the logged-in parent's full profile. */
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    if (user.role !== "PARENT") throw ApiError.forbidden("Only parents have a profile here");
    const parent = await getParentProfile(user.id);
    if (!parent) throw ApiError.notFound("Parent profile not found");
    const full = await prisma.parent.findUnique({
      where: { id: parent.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        address: true,
        emergencyContact: true,
      },
    });
    res.json({ parent: full });
  })
);

/** Update the logged-in parent's contact info. */
router.patch(
  "/profile",
  validate({ body: profileSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    if (user.role !== "PARENT") throw ApiError.forbidden("Only parents have a profile here");
    const parent = await getParentProfile(user.id);
    if (!parent) throw ApiError.notFound("Parent profile not found");

    const { fullName, phone, address, emergencyContact } = req.body;
    const updated = await prisma.parent.update({
      where: { id: parent.id },
      data: { fullName, phone, address, emergencyContact: emergencyContact || null },
      select: { id: true, fullName: true, phone: true, address: true, emergencyContact: true },
    });
    logger.info("Parent profile updated", { parentId: parent.id });
    res.json({ parent: updated });
  })
);

/** Change the logged-in user's password (any role). */
router.post(
  "/change-password",
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw ApiError.unauthorized();

    const ok = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!ok) throw ApiError.badRequest("Current password is incorrect");

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    logger.info("Password changed", { userId: user.id });
    res.json({ message: "Password updated successfully." });
  })
);

export default router;
