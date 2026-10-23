import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";
import { requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { z } from "zod";
import { GALLERY_CATEGORIES } from "../../lib/constants";
import { getStorage } from "../../services/storage.service";
import multer from "multer";
import { env } from "../../config/env";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WebP, GIF or SVG images are allowed"));
      return;
    }
    cb(null, true);
  },
});

// Public: list all images, newest first
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const images = await prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, category: true, imageUrl: true, createdAt: true },
    });
    res.json({ images });
  })
);

const imageMetaSchema = z.object({
  title: z.string().trim().min(2).max(200),
  category: z.enum(GALLERY_CATEGORIES),
});

// Admin: upload an image
router.post(
  "/",
  requireRole("ADMIN"),
  upload.single("image"),
  validate({ body: imageMetaSchema }),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "An image file is required (field name: image)" });
      return;
    }
    const stored = await getStorage().save(file.buffer, file.originalname, "gallery");
    const image = await prisma.galleryImage.create({
      data: {
        title: req.body.title,
        category: req.body.category,
        imageUrl: stored.url,
        publicId: stored.key,
        uploadedById: req.user!.id,
      },
    });
    res.status(201).json({ image });
  })
);

// Admin: delete an image
router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const image = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    await prisma.galleryImage.delete({ where: { id: image.id } });
    if (image.publicId) await getStorage().remove(image.publicId);
    res.json({ ok: true });
  })
);

export default router;
