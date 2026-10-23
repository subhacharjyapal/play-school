import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError, asyncHandler } from "../../lib/errors";
import { requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { applicationInputSchema, reviewSchema } from "./applications.schemas";
import { approveApplication, rejectApplication } from "../../services/approval.service";
import { getEmailService, appBaseUrl } from "../../services/email.service";
import { authLimiter } from "../../middleware/rateLimit";
import { z } from "zod";

const router = Router();

// Public: submit an admission application
router.post(
  "/",
  authLimiter,
  validate({ body: applicationInputSchema }),
  asyncHandler(async (req, res) => {
    const d = req.body;
    const application = await prisma.application.create({
      data: {
        childFullName: d.childFullName,
        dob: d.dob,
        gender: d.gender,
        program: d.program,
        parentName: d.parentName,
        relationship: d.relationship,
        phone: d.phone,
        email: d.email,
        address: d.address,
        emergencyContact: d.emergencyContact,
        medicalNotes: d.medicalNotes || null,
        message: d.message || null,
      },
      select: { id: true, status: true, createdAt: true },
    });
    res.status(201).json({
      application,
      message:
        "Thank you! Your application has been received. Our team will review it and contact you within 2–3 working days.",
    });
  })
);

// Admin: list applications (filterable by status)
router.get(
  "/",
  requireRole("ADMIN"),
  validate({
    query: z.object({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const status = (req.query as { status?: string }).status;
    const applications = await prisma.application.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
    res.json({ applications });
  })
);

// Admin: approve an application (creates parent account + student, emails credentials)
router.post(
  "/:id/approve",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Application not found");
    if (existing.status !== "PENDING") {
      throw ApiError.conflict("This application has already been reviewed");
    }
    await approveApplication(req.params.id, req.user!.id);
    res.json({ ok: true, message: "Application approved. Login credentials emailed to the parent." });
  })
);

// Admin: reject an application
router.post(
  "/:id/reject",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Application not found");
    if (existing.status !== "PENDING") {
      throw ApiError.conflict("This application has already been reviewed");
    }
    await rejectApplication(req.params.id, req.user!.id);
    res.json({ ok: true, message: "Application rejected." });
  })
);

// Admin: re-send credentials email for an approved application
router.post(
  "/:id/resend-credentials",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { student: true },
    });
    if (!application || application.status !== "APPROVED" || !application.student) {
      throw ApiError.notFound("Approved application not found");
    }
    await getEmailService().send({
      to: application.email,
      subject: "Your Little Stars Play School parent portal details",
      text: [
        `Dear ${application.parentName},`,
        "",
        `Here are your parent portal details for ${application.student.fullName}'s records:`,
        `  Email: ${application.email}`,
        `Log in here: ${appBaseUrl()}/login`,
        "",
        "If you have forgotten your password, use the 'Forgot password?' link on the login page.",
        "",
        "Little Stars Play School",
      ].join("\n"),
    });
    res.json({ ok: true, message: "Credentials reminder emailed." });
  })
);

export default router;
