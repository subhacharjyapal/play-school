import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";
import { requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

// Public: active announcements with upcoming/undated events first
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, body: true, eventDate: true, createdAt: true },
    });
    res.json({ announcements });
  })
);

const announcementSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(5000),
  eventDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

router.post(
  "/",
  requireRole("ADMIN"),
  validate({ body: announcementSchema }),
  asyncHandler(async (req, res) => {
    const { title, body, eventDate, isActive } = req.body;
    const announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        eventDate: eventDate ?? null,
        isActive: isActive ?? true,
        createdById: req.user!.id,
      },
    });
    res.status(201).json({ announcement });
  })
);

router.put(
  "/:id",
  requireRole("ADMIN"),
  validate({ body: announcementSchema }),
  asyncHandler(async (req, res) => {
    const { title, body, eventDate, isActive } = req.body;
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        title,
        body,
        eventDate: eventDate ?? null,
        isActive: isActive ?? true,
      },
    });
    res.json({ announcement });
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
