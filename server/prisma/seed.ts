/**
 * Seed script: creates demo data for development.
 *
 * Users: 1 admin, 2 teachers, 5 parents, 8 students
 * Plus: classrooms, tests + results, progress reports, attendance,
 * gallery images (local SVG placeholders), announcements, one pending application.
 *
 * Demo credentials (all passwords are the same for easy testing):
 *   admin@littlestars.example / Admin@123
 *   teacher1@littlestars.example / Teacher@123   (Priya Sharma)
 *   teacher2@littlestars.example / Teacher@123   (Rahul Verma)
 *   parent1@littlestars.example / Parent@123     (Amit Patel — 2 children)
 *   parent2@littlestars.example / Parent@123
 *   parent3@littlestars.example / Parent@123
 *   parent4@littlestars.example / Parent@123
 *   parent5@littlestars.example / Parent@123
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// ---------- helpers ----------

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Generates a cheerful SVG placeholder and returns the public URL path. */
function writeSvg(
  folder: string,
  name: string,
  label: string,
  w: number,
  h: number,
  colors: [string, string]
): string {
  const dir = ensureDir(path.join(UPLOAD_DIR, folder));
  const safe = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const file = path.join(dir, `${safe}.svg`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="100%" stop-color="${colors[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.82}" cy="${h * 0.2}" r="${Math.min(w, h) * 0.12}" fill="#ffffff" opacity="0.35"/>
  <circle cx="${w * 0.15}" cy="${h * 0.85}" r="${Math.min(w, h) * 0.18}" fill="#ffffff" opacity="0.25"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
    font-family="Verdana, sans-serif" font-size="${Math.min(w, h) * 0.09}" fill="#334155" font-weight="bold">${label}</text>
</svg>`;
  fs.writeFileSync(file, svg, "utf8");
  return `/uploads/${folder}/${safe}.svg`;
}

const PASTELS: [string, string][] = [
  ["#bae6fd", "#7dd3fc"], // sky blue
  ["#fde68a", "#fcd34d"], // sunny yellow
  ["#fca5a5", "#f87171"], // coral
  ["#a7f3d0", "#6ee7b7"], // mint
  ["#ddd6fe", "#c4b5fd"], // lavender
  ["#fbcfe8", "#f9a8d4"], // pink
];

function pick(colors: [string, string][] , i: number): [string, string] {
  return colors[i % colors.length];
}

const YEAR = "2025-26";

// ---------- main ----------

async function main() {
  console.log("Seeding Little Stars Play School demo data...\n");

  // Clean existing data (idempotent re-seed)
  await prisma.passwordResetToken.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.test.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.application.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  // --- Users ---
  const admin = await prisma.user.create({
    data: {
      email: "admin@littlestars.example",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
    },
  });

  const teacherUser1 = await prisma.user.create({
    data: {
      email: "teacher1@littlestars.example",
      passwordHash: await bcrypt.hash("Teacher@123", 10),
      role: "TEACHER",
    },
  });
  const teacherUser2 = await prisma.user.create({
    data: {
      email: "teacher2@littlestars.example",
      passwordHash: await bcrypt.hash("Teacher@123", 10),
      role: "TEACHER",
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacherUser1.id,
      fullName: "Priya Sharma",
      phone: "+1 (512) 555-0101",
      qualification: "B.A. Early Childhood Education",
      photoUrl: writeSvg("staff", "priya-sharma", "Priya S.", 400, 400, pick(PASTELS, 0)),
      bio: "Ms. Priya has 8 years of experience in play-based early education. She loves storytelling, rhymes, and art activities.",
    },
  });
  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      fullName: "Rahul Verma",
      phone: "+1 (512) 555-0102",
      qualification: "M.Ed., Montessori Certified",
      photoUrl: writeSvg("staff", "rahul-verma", "Rahul V.", 400, 400, pick(PASTELS, 2)),
      bio: "Mr. Rahul specializes in motor-skills development and outdoor play. He has been teaching LKG and UKG for 6 years.",
    },
  });

  // --- Classrooms ---
  const classLkg = await prisma.classroom.create({
    data: { name: "LKG - Blue", program: "LKG", teacherId: teacher1.id },
  });
  const classUkg = await prisma.classroom.create({
    data: { name: "UKG - Sunshine", program: "UKG", teacherId: teacher2.id },
  });
  const classNursery = await prisma.classroom.create({
    data: { name: "Nursery - Rainbow", program: "NURSERY", teacherId: teacher1.id },
  });
  const classPlaygroup = await prisma.classroom.create({
    data: { name: "Playgroup - Butterflies", program: "PLAYGROUP", teacherId: teacher2.id },
  });

  // --- Parents & Students ---
  const parentData = [
    { email: "parent1@littlestars.example", name: "Amit Patel", phone: "+1 (512) 555-0201", children: 2 },
    { email: "parent2@littlestars.example", name: "Sunita Rao", phone: "+1 (512) 555-0202", children: 1 },
    { email: "parent3@littlestars.example", name: "James Cooper", phone: "+1 (512) 555-0203", children: 2 },
    { email: "parent4@littlestars.example", name: "Meera Iyer", phone: "+1 (512) 555-0204", children: 1 },
    { email: "parent5@littlestars.example", name: "David Kim", phone: "+1 (512) 555-0205", children: 2 },
  ];

  const studentNames = [
    ["Aarav Patel", "2021-05-14", "MALE", "LKG"],
    ["Diya Patel", "2022-08-02", "FEMALE", "NURSERY"],
    ["Kavya Rao", "2021-11-20", "FEMALE", "LKG"],
    ["Ethan Cooper", "2020-03-09", "MALE", "UKG"],
    ["Lily Cooper", "2022-01-25", "FEMALE", "PLAYGROUP"],
    ["Rohan Iyer", "2020-07-18", "MALE", "UKG"],
    ["Sophie Kim", "2021-09-30", "FEMALE", "LKG"],
    ["Daniel Kim", "2022-12-05", "MALE", "NURSERY"],
  ] as const;

  const classroomsByProgram: Record<string, string> = {
    LKG: classLkg.id,
    UKG: classUkg.id,
    NURSERY: classNursery.id,
    PLAYGROUP: classPlaygroup.id,
  };

  const parents = [];
  let studentIdx = 0;
  for (const [i, pd] of parentData.entries()) {
    const user = await prisma.user.create({
      data: {
        email: pd.email,
        passwordHash: await bcrypt.hash("Parent@123", 10),
        role: "PARENT",
      },
    });
    const parent = await prisma.parent.create({
      data: {
        userId: user.id,
        fullName: pd.name,
        phone: pd.phone,
        address: `${100 + i} Oak Avenue, Austin, TX 7870${i + 2}`,
        emergencyContact: "+1 (512) 555-0900",
        relationshipLabel: "Guardian",
      },
    });
    parents.push(parent);

    for (let c = 0; c < pd.children; c++) {
      const [name, dob, gender, program] = studentNames[studentIdx];
      await prisma.student.create({
        data: {
          fullName: name,
          dob: new Date(dob),
          gender,
          program,
          photoUrl: writeSvg(
            "students",
            name.toLowerCase().replace(/\s+/g, "-"),
            name.split(" ")[0],
            400,
            400,
            pick(PASTELS, studentIdx)
          ),
          classroomId: classroomsByProgram[program],
          parentId: parent.id,
        },
      });
      studentIdx++;
    }
  }

  // --- Fetch all students for tests/progress/attendance ---
  const students = await prisma.student.findMany({
    include: { classroom: true, parent: true },
    orderBy: { createdAt: "asc" },
  });

  // --- Tests + Results ---
  const testDefs = [
    { title: "Alphabet Recognition", subject: "Language", maxMarks: 20, term: "TERM1", daysAgo: 120 },
    { title: "Numbers 1-50", subject: "Math", maxMarks: 25, term: "TERM1", daysAgo: 110 },
    { title: "Shape & Color Sort", subject: "Motor Skills", maxMarks: 15, term: "TERM2", daysAgo: 60 },
    { title: "Story Comprehension", subject: "Language", maxMarks: 20, term: "TERM2", daysAgo: 45 },
    { title: "Simple Addition", subject: "Math", maxMarks: 30, term: "TERM3", daysAgo: 15 },
  ] as const;

  let resultCount = 0;
  for (const t of testDefs) {
    const classroom =
      t.subject === "Math" ? classLkg : t.subject === "Language" ? classLkg : classNursery;
    const test = await prisma.test.create({
      data: {
        title: t.title,
        subject: t.subject,
        date: new Date(Date.now() - t.daysAgo * 24 * 60 * 60 * 1000),
        maxMarks: t.maxMarks,
        term: t.term,
        academicYear: YEAR,
        classroomId: classroom.id,
        createdById: admin.id,
      },
    });

    const classStudents = students.filter((s) => s.classroomId === classroom.id);
    for (const [si, s] of classStudents.entries()) {
      // Deterministic pseudo-random marks between 55% and 98% of max
      const pct = 0.55 + (((si * 17 + t.title.length * 7) % 44) / 100);
      const marks = Math.round(t.maxMarks * pct);
      const grade =
        pct >= 0.9 ? "A+" : pct >= 0.8 ? "A" : pct >= 0.7 ? "B" : pct >= 0.6 ? "C" : "D";
      await prisma.testResult.create({
        data: {
          testId: test.id,
          studentId: s.id,
          marksObtained: marks,
          grade,
          remarks:
            pct >= 0.85
              ? "Excellent work!"
              : pct >= 0.7
                ? "Good progress, keep practicing."
                : "Needs more practice with guidance.",
        },
      });
      resultCount++;
    }
  }

  // --- Progress reports (3 terms for LKG/Nursery students) ---
  let reportCount = 0;
  const terms = ["TERM1", "TERM2", "TERM3"] as const;
  for (const s of students) {
    if (s.classroomId !== classLkg.id && s.classroomId !== classNursery.id) continue;
    for (const [ti, term] of terms.entries()) {
      const bump = ti * 0.4;
      const rating = (base: number) => Math.min(5, Math.max(1, Math.round(base + bump)));
      const base = 2.8 + ((s.fullName.length * 13) % 15) / 10; // 2.8 - 4.2
      await prisma.progressReport.create({
        data: {
          studentId: s.id,
          teacherId: s.classroomId === classLkg.id ? teacher1.id : teacher1.id,
          term,
          academicYear: YEAR,
          attendancePct: Math.min(99, 78 + ti * 5 + (s.fullName.length % 6)),
          languageRating: rating(base),
          mathRating: rating(base - 0.3),
          motorRating: rating(base + 0.4),
          socialRating: rating(base + 0.2),
          creativityRating: rating(base + 0.5),
          disciplineRating: rating(base + 0.1),
          teacherRemarks:
            term === "TERM1"
              ? "Settling in well and becoming more confident each day."
              : term === "TERM2"
                ? "Showing lovely improvement in group activities."
                : "A wonderful term! Very engaged and helpful with classmates.",
        },
      });
      reportCount++;
    }
  }

  // --- Attendance (last 20 school days for LKG students) ---
  let attendanceCount = 0;
  const lkgStudents = students.filter((s) => s.classroomId === classLkg.id);
  for (let d = 20; d >= 1; d--) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - d);
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue; // skip weekends
    for (const [si, s] of lkgStudents.entries()) {
      const roll = (d * 7 + si * 3) % 10;
      const status = roll === 0 ? "ABSENT" : roll === 1 ? "LATE" : "PRESENT";
      await prisma.attendance.create({
        data: {
          studentId: s.id,
          date,
          status,
          markedById: teacherUser1.id,
        },
      });
      attendanceCount++;
    }
  }

  // --- Gallery images (SVG placeholders) ---
  const galleryDefs = [
    { title: "Annual Day Celebration", category: "EVENT", w: 800, h: 600 },
    { title: "Coloring Fun", category: "CLASSROOM", w: 600, h: 800 },
    { title: "Sports Day Races", category: "SPORTS", w: 800, h: 500 },
    { title: "Diya Decorating", category: "FESTIVAL", w: 600, h: 600 },
    { title: "Puppet Show", category: "ACTIVITY", w: 800, h: 600 },
    { title: "Story Time Circle", category: "CLASSROOM", w: 700, h: 500 },
    { title: "Sports Day Relay", category: "SPORTS", w: 600, h: 750 },
    { title: "Christmas Tree Craft", category: "FESTIVAL", w: 800, h: 600 },
    { title: "Water Play Day", category: "ACTIVITY", w: 600, h: 600 },
    { title: "Graduation Day", category: "EVENT", w: 800, h: 550 },
    { title: "Building Blocks Time", category: "CLASSROOM", w: 650, h: 800 },
    { title: "Rangoli Making", category: "FESTIVAL", w: 800, h: 600 },
  ];

  let galleryCount = 0;
  for (const [gi, g] of galleryDefs.entries()) {
    const url = writeSvg(
      "gallery",
      g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      g.title,
      g.w,
      g.h,
      pick(PASTELS, gi)
    );
    await prisma.galleryImage.create({
      data: {
        title: g.title,
        category: g.category,
        imageUrl: url,
        publicId: path.basename(url),
        uploadedById: admin.id,
      },
    });
    galleryCount++;
  }

  // --- Announcements ---
  await prisma.announcement.createMany({
    data: [
      {
        title: "Admissions Open for 2026-27",
        body: "We are now accepting applications for the next academic year. Limited seats available per program — register early!",
        eventDate: null,
        isActive: true,
        createdById: admin.id,
      },
      {
        title: "Sports Day — March 14",
        body: "Annual Sports Day will be held on campus. Parents are welcome to attend from 9:00 AM.",
        eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdById: admin.id,
      },
      {
        title: "Summer Camp Registration",
        body: "Fun-filled 2-week summer camp with water play, art and story sessions. Contact the office for details.",
        eventDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdById: admin.id,
      },
    ],
  });

  // --- One pending application for the admin demo ---
  await prisma.application.create({
    data: {
      childFullName: "Ishita Sharma",
      dob: new Date("2022-04-11"),
      gender: "FEMALE",
      program: "NURSERY",
      parentName: "Neha Sharma",
      relationship: "Mother",
      phone: "+1 (512) 555-0301",
      email: "neha.sharma@example.com",
      address: "88 Maple Drive, Austin, TX 78745",
      emergencyContact: "+1 (512) 555-0302",
      medicalNotes: "Mild dust allergy — carries an inhaler.",
      message: "Our daughter is excited to join the nursery class!",
      status: "PENDING",
    },
  });

  console.log("Seed complete ✔");
  console.log(`  users:       8 (1 admin, 2 teachers, 5 parents)`);
  console.log(`  classrooms:  4`);
  console.log(`  students:    ${students.length}`);
  console.log(`  tests:       ${testDefs.length} (${resultCount} results)`);
  console.log(`  reports:     ${reportCount}`);
  console.log(`  attendance:  ${attendanceCount} records`);
  console.log(`  gallery:     ${galleryCount} images (SVG placeholders in uploads/)`);
  console.log(`  apps:        1 pending`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
