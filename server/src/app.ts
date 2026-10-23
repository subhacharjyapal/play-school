import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { csrfProtection } from "./middleware/csrf";
import { globalLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/error";
import authRoutes from "./modules/auth/auth.routes";
import galleryRoutes from "./modules/gallery/gallery.routes";
import announcementRoutes from "./modules/announcements/announcements.routes";
import contactRoutes from "./modules/contact/contact.routes";
import siteRoutes from "./modules/site/site.routes";
import applicationRoutes from "./modules/applications/applications.routes";
import portalRoutes from "./modules/portal/portal.routes";
import reportRoutes from "./modules/reports/reports.routes";
import teacherRoutes from "./modules/teacher/teacher.routes";
import adminRoutes from "./modules/admin/admin.routes";

export function createApp() {
  const app = express();

  // Behind a proxy in prod (nginx etc.)
  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, // dev server serves the SPA; Vite handles its own CSP
    })
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(csrfProtection);
  app.use(globalLimiter);

  // Uploaded files (local disk in dev)
  app.use(
    `/${env.UPLOAD_DIR}`,
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      maxAge: env.NODE_ENV === "production" ? "7d" : 0,
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "little-stars-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/gallery", galleryRoutes);
  app.use("/api/announcements", announcementRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/site", siteRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api", portalRoutes); // /children, /students/:id/progress|results, /profile, /change-password
  app.use("/api", reportRoutes); // /students/:id/report-card
  app.use("/api/teacher", teacherRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
