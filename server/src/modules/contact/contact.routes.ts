import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { requireRole } from "../../middleware/auth";
import { z } from "zod";

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
});

router.post(
  "/",
  validate({ body: contactSchema }),
  asyncHandler(async (req, res) => {
    const { name, email, phone, message } = req.body;
    await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, message },
    });
    res.status(201).json({ message: "Thanks for reaching out! We will get back to you soon." });
  })
);

// Admin: list messages
router.get(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ messages });
  })
);

export default router;
