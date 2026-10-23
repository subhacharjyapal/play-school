import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma";
import { ApiError, asyncHandler } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { canUserAccessStudent } from "../../services/ownership.service";
import { PROGRAM_LABELS, TERM_LABELS, SKILLS } from "../../lib/constants";
import { SCHOOL } from "../../lib/constants";

const router = Router();

const COLORS = {
  sky: "#38bdf8",
  sun: "#fbbf24",
  coral: "#fb7185",
  mint: "#34d399",
  ink: "#1e293b",
  gray: "#64748b",
};

function barColor(pct: number): string {
  if (pct >= 80) return COLORS.mint;
  if (pct >= 60) return COLORS.sun;
  return COLORS.coral;
}

/**
 * GET /api/students/:id/report-card?term=TERM1&year=2025-26
 * Streams a cheerful PDF report card. Ownership-checked.
 */
router.get(
  "/students/:id/report-card",
  requireAuth,
  asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const allowed = await canUserAccessStudent(req.user!, studentId);
    if (!allowed) throw ApiError.forbidden("You do not have access to this student's data");

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classroom: { include: { teacher: true } },
        progressReports: { include: { teacher: true } },
        testResults: {
          include: { test: true },
          orderBy: { test: { date: "asc" } },
        },
      },
    });
    if (!student) throw ApiError.notFound("Student not found");

    const term = typeof req.query.term === "string" ? req.query.term : null;
    const year = typeof req.query.year === "string" ? req.query.year : null;

    const reports = student.progressReports.filter(
      (r) => (!term || r.term === term) && (!year || r.academicYear === year)
    );
    const results = student.testResults.filter(
      (r) => (!term || r.test.term === term) && (!year || r.test.academicYear === year)
    );

    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    const filename = `report-card-${student.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    const pageWidth = doc.page.width - 100; // margins
    let y = 50;

    // ---- Header ----
    doc.roundedRect(40, 32, doc.page.width - 80, 74, 12).fill("#e0f2fe");
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(20).text(SCHOOL.name, 50, 46, { align: "center", width: pageWidth });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray)
      .text(`Progress Report Card • ${SCHOOL.city}`, 50, 72, { align: "center", width: pageWidth });
    y = 128;

    // ---- Student info ----
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(13).text("Student Information", 50, y);
    y += 20;
    doc.font("Helvetica").fontSize(10);
    const info: Array<[string, string]> = [
      ["Name", student.fullName],
      ["Class", student.classroom?.name ?? PROGRAM_LABELS[student.program as keyof typeof PROGRAM_LABELS] ?? student.program],
      ["Teacher", student.classroom?.teacher?.fullName ?? "—"],
      ["Program", PROGRAM_LABELS[student.program as keyof typeof PROGRAM_LABELS] ?? student.program],
      ["Date of Birth", student.dob.toLocaleDateString("en-US")],
      ["Report Period", [term ? TERM_LABELS[term as keyof typeof TERM_LABELS] : "All terms", year ?? "All years"].join(" • ")],
    ];
    for (const [label, value] of info) {
      doc.font("Helvetica-Bold").fillColor(COLORS.gray).text(`${label}: `, 50, y, { continued: true });
      doc.font("Helvetica").fillColor(COLORS.ink).text(value);
      y += 16;
    }
    y += 10;

    // ---- Skill ratings ----
    doc.roundedRect(40, y, doc.page.width - 80, 26, 6).fill(COLORS.sky);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text("Skill Ratings (1–5)", 50, y + 7);
    y += 40;

    if (reports.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text("No progress reports recorded for this period.", 50, y);
      y += 24;
    }
    for (const report of reports) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.ink)
        .text(`${TERM_LABELS[report.term as keyof typeof TERM_LABELS] ?? report.term} • ${report.academicYear}   (Attendance: ${report.attendancePct}%)`, 50, y);
      y += 18;
      const skillData = SKILLS.map((s) => ({
        label: s.label,
        value: report[`${s.key}` as keyof typeof report] as number,
      }));
      for (const skill of skillData) {
        doc.font("Helvetica").fontSize(10).fillColor(COLORS.ink).text(skill.label, 50, y, { width: 130 });
        // star rating
        const stars = "★".repeat(skill.value) + "☆".repeat(5 - skill.value);
        doc.font("Helvetica").fontSize(12).fillColor(COLORS.sun).text(stars, 190, y - 2);
        doc.fillColor(COLORS.gray).fontSize(9).text(`${skill.value}/5`, 280, y);
        y += 18;
      }
      if (report.teacherRemarks) {
        doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.gray)
          .text(`Remarks: ${report.teacherRemarks}`, 50, y, { width: pageWidth });
        y += 20;
      }
      y += 8;
    }

    // ---- Test results table ----
    if (y > doc.page.height - 220) {
      doc.addPage();
      y = 50;
    }
    doc.roundedRect(40, y, doc.page.width - 80, 26, 6).fill(COLORS.coral);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text("Test & Assessment Results", 50, y + 7);
    y += 40;

    if (results.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text("No tests recorded for this period.", 50, y);
      y += 24;
    } else {
      // Table header
      const cols = { date: 50, title: 130, subject: 280, marks: 360, grade: 430 };
      doc.rect(45, y - 4, pageWidth + 10, 18).fill("#f1f5f9");
      doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.gray);
      doc.text("Date", cols.date, y, { width: 76 });
      doc.text("Test", cols.title, y, { width: 145 });
      doc.text("Subject", cols.subject, y, { width: 76 });
      doc.text("Marks", cols.marks, y, { width: 66 });
      doc.text("Grade", cols.grade, y, { width: 50 });
      y += 22;

      doc.font("Helvetica").fontSize(9);
      for (const r of results) {
        if (y > doc.page.height - 90) {
          doc.addPage();
          y = 60;
        }
        doc.fillColor(COLORS.ink);
        doc.text(r.test.date.toLocaleDateString("en-US"), cols.date, y, { width: 76 });
        doc.text(r.test.title, cols.title, y, { width: 145, ellipsis: true });
        doc.text(r.test.subject, cols.subject, y, { width: 76 });
        doc.text(`${r.marksObtained}/${r.test.maxMarks}`, cols.marks, y, { width: 66 });
        doc.fillColor(barColor((r.marksObtained / r.test.maxMarks) * 100)).font("Helvetica-Bold")
          .text(r.grade, cols.grade, y, { width: 50 });
        doc.font("Helvetica");
        y += 16;
      }
    }

    // ---- Footer ----
    const footerY = doc.page.height - 70;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor("#e2e8f0").stroke();
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.gray)
      .text(`Generated on ${new Date().toLocaleDateString("en-US")} by ${SCHOOL.name}. Play • Learn • Grow together!`, 50, footerY + 12, {
        align: "center",
        width: pageWidth,
      });

    doc.end();
  })
);

export default router;
