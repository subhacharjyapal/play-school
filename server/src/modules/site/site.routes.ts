import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";

const router = Router();

// Public: staff profiles for the About page (no user emails or internals)
router.get(
  "/staff",
  asyncHandler(async (_req, res) => {
    const staff = await prisma.teacher.findMany({
      select: {
        id: true,
        fullName: true,
        qualification: true,
        photoUrl: true,
        bio: true,
        classrooms: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
    res.json({ staff });
  })
);

export default router;
