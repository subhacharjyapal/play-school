import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas";

const router = Router();

router.post("/login", authLimiter, validate({ body: loginSchema }), controller.login);
router.post("/logout", controller.logout);
router.get("/me", requireAuth, controller.me);
router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate({ body: resetPasswordSchema }),
  controller.resetPassword
);

export default router;
