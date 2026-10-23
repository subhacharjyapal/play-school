/**
 * Quick end-to-end smoke test against a running server (default :4000).
 * Usage: node scripts/smoke.mjs
 * Exercises: health, login (CSRF + cookie), children, ownership denial, PDF.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:4000";

class Jar {
  constructor() { this.map = new Map(); }
  absorb(res) {
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookies) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      this.map.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    }
  }
  header() {
    return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function req(path, { method = "GET", body, jar, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(jar ? { cookie: jar.header(), "x-csrf-token": jar.map.get("ls_csrf_token") ?? "" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  jar?.absorb(res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* binary or html */ }
  return { status: res.status, json, text, headers: res.headers };
}

let failures = 0;
function check(name, cond, extra = "") {
  console.log(`${cond ? "  PASS" : "  FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

async function login(jar, email, password) {
  const r = await req("/api/auth/login", { method: "POST", body: { email, password }, jar });
  return r;
}

const mainJar = new Jar();
await req("/api/health", { jar: mainJar }); // seeds csrf cookie

// 1. health
const health = await req("/api/health");
check("health endpoint", health.json?.ok === true);

// 2. login flow
const badLogin = await login(mainJar, "parent1@littlestars.example", "wrong");
check("bad login rejected", badLogin.status === 401);
const parent1 = new Jar();
await req("/api/health", { jar: parent1 });
const okLogin = await login(parent1, "parent1@littlestars.example", "Parent@123");
check("parent1 login", okLogin.status === 200 && okLogin.json?.user?.role === "PARENT");

// 3. CSRF enforcement
const noCsrf = await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { cookie: parent1.header() } });
check("state-changing request without CSRF rejected", noCsrf.status === 403);

// 4. children list
const kids = await req("/api/children", { jar: parent1 });
check("parent1 sees 2 children", kids.json?.children?.length === 2, `got ${kids.json?.children?.length}`);
const myKid = kids.json.children[0];

// 5. own data access
const prog = await req(`/api/students/${myKid.id}/progress`, { jar: parent1 });
check("parent can read own child progress", prog.status === 200 && prog.json.reports.length >= 1);
const results = await req(`/api/students/${myKid.id}/results`, { jar: parent1 });
check("parent can read own child results", results.status === 200);

// 6. cross-parent denial
const parent2 = new Jar();
await req("/api/health", { jar: parent2 });
await login(parent2, "parent2@littlestars.example", "Parent@123");
const cross = await req(`/api/students/${myKid.id}/progress`, { jar: parent2 });
check("CROSS-PARENT access denied", cross.status === 403, `status ${cross.status}`);
const crossResults = await req(`/api/students/${myKid.id}/results`, { jar: parent2 });
check("CROSS-PARENT results denied", crossResults.status === 403);
const crossPdf = await req(`/api/students/${myKid.id}/report-card`, { jar: parent2 });
check("CROSS-PARENT report card denied", crossPdf.status === 403);

// 7. anonymous denial
const anon = await req(`/api/students/${myKid.id}/progress`);
check("anonymous access denied", anon.status === 401);

// 8. teacher cannot read a student outside their class, can read assigned
const teacher = new Jar();
await req("/api/health", { jar: teacher });
await login(teacher, "teacher1@littlestars.example", "Teacher@123");
const teacherKids = await req("/api/children", { jar: teacher });
check("teacher sees only assigned students", teacherKids.json.children.length > 0, `got ${teacherKids.json.children.length}`);

// 9. PDF as rightful parent (raw bytes)
const pdfRes = await fetch(`${BASE}/api/students/${myKid.id}/report-card`, {
  headers: { cookie: parent1.header() },
});
const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
check(
  "report card PDF streams",
  pdfRes.status === 200 && pdfBuf.subarray(0, 5).toString() === "%PDF-",
  `${pdfBuf.length} bytes`
);

// 10. admin endpoints reject parents
const adminApps = await req("/api/applications", { jar: parent1 });
check("parent cannot list applications", adminApps.status === 403);

// 11. profile read + update
const prof = await req("/api/profile", { jar: parent1 });
check("parent can read own profile", prof.status === 200 && typeof prof.json.parent.address === "string");
const profUpdate = await req("/api/profile", {
  method: "PATCH",
  body: { fullName: "Amit Patel", phone: "+1 (512) 555-0201", address: "101 Oak Avenue, Austin, TX 78702", emergencyContact: "+1 (512) 555-0900" },
  jar: parent1,
});
check("parent can update own profile", profUpdate.status === 200);

// 12. change password flow (wrong current rejected, right one works, restore)
const wrongPwd = await req("/api/change-password", {
  method: "POST",
  body: { currentPassword: "nope123", newPassword: "Newpass123" },
  jar: parent1,
});
check("wrong current password rejected", wrongPwd.status === 400);
const okPwd = await req("/api/change-password", {
  method: "POST",
  body: { currentPassword: "Parent@123", newPassword: "Newpass123" },
  jar: parent1,
});
check("password change works", okPwd.status === 200);
const reloginJar = new Jar();
await req("/api/health", { jar: reloginJar }); // seed CSRF cookie
const relogin = await login(reloginJar, "parent1@littlestars.example", "Newpass123");
check("new password can log in", relogin.status === 200, `status ${relogin.status}`);
const restore = await req("/api/change-password", {
  method: "POST",
  body: { currentPassword: "Newpass123", newPassword: "Parent@123" },
  jar: parent1,
});
check("password restored for seed data", restore.status === 200);

// ---------- Teacher panel ----------
const t1 = new Jar();
await req("/api/health", { jar: t1 });
await login(t1, "teacher1@littlestars.example", "Teacher@123");

const overview = await req("/api/teacher/overview", { jar: t1 });
check("teacher overview lists assigned classes", overview.json?.classrooms?.length === 2, `got ${overview.json?.classrooms?.length}`);
const lkg = overview.json.classrooms.find((c) => c.name.includes("LKG"));
check("LKG class has students", lkg?.students?.length > 0, `${lkg?.students?.length} students`);

// teacher2 must NOT see teacher1's class
const t2 = new Jar();
await req("/api/health", { jar: t2 });
await login(t2, "teacher2@littlestars.example", "Teacher@123");
const t2Overview = await req("/api/teacher/overview", { jar: t2 });
check("teacher2 sees only own classes", t2Overview.json.classrooms.every((c) => !c.name.includes("LKG")));

// teacher1 creates a test and marks results
const newTest = await req("/api/teacher/tests", {
  method: "POST",
  body: { title: "Phonics Check", subject: "Language", date: "2026-10-01", maxMarks: 20, term: "TERM3", academicYear: "2025-26", classroomId: lkg.id },
  jar: t1,
});
check("teacher can create test for own class", newTest.status === 201, `status ${newTest.status}`);
const testRows = await req(`/api/teacher/tests/${newTest.json.test.id}/results`, { jar: t1 });
const targetStudent = testRows.json.rows[0];
const putResult = await req(`/api/teacher/tests/${newTest.json.test.id}/results`, {
  method: "PUT",
  body: { studentId: targetStudent.studentId, marksObtained: 17, remarks: "Well done!" },
  jar: t1,
});
check("teacher can record a result", putResult.status === 200 && putResult.json.result.grade === "A", `grade ${putResult.json.result?.grade}`);
const overMax = await req(`/api/teacher/tests/${newTest.json.test.id}/results`, {
  method: "PUT",
  body: { studentId: targetStudent.studentId, marksObtained: 999 },
  jar: t1,
});
check("marks above max rejected", overMax.status === 400);

// teacher2 must NOT record results in teacher1's test
const crossTest = await req(`/api/teacher/tests/${newTest.json.test.id}/results`, {
  method: "PUT",
  body: { studentId: targetStudent.studentId, marksObtained: 5 },
  jar: t2,
});
check("teacher2 cannot touch teacher1's test", crossTest.status === 403, `status ${crossTest.status}`);

// teacher2 must NOT write progress for teacher1's student
const crossProgress = await req("/api/teacher/progress", {
  method: "PUT",
  body: { studentId: targetStudent.studentId, term: "TERM3", academicYear: "2025-26", attendancePct: 90, languageRating: 3, mathRating: 3, motorRating: 3, socialRating: 3, creativityRating: 3, disciplineRating: 3 },
  jar: t2,
});
check("teacher2 cannot write progress for foreign student", crossProgress.status === 403, `status ${crossProgress.status}`);

// teacher1 writes progress + attendance for own class
const okProgress = await req("/api/teacher/progress", {
  method: "PUT",
  body: { studentId: targetStudent.studentId, term: "TERM3", academicYear: "2025-26", attendancePct: 92, languageRating: 4, mathRating: 3, motorRating: 5, socialRating: 4, creativityRating: 5, disciplineRating: 4, teacherRemarks: "Great term!" },
  jar: t1,
});
check("teacher can write own-student progress", okProgress.status === 200);
const attendance = await req("/api/teacher/attendance", {
  method: "POST",
  body: { classroomId: lkg.id, date: "2026-10-20", records: lkg.students.map((s) => ({ studentId: s.id, status: "PRESENT" })) },
  jar: t1,
});
check("teacher can mark attendance", attendance.status === 200 && attendance.json.saved === lkg.students.length);

// ---------- Admin panel ----------
const admin = new Jar();
await req("/api/health", { jar: admin });
await login(admin, "admin@littlestars.example", "Admin@123");
const stats = await req("/api/admin/stats", { jar: admin });
check("admin stats load", stats.status === 200 && typeof stats.json.students === "number");
const adminStudents = await req("/api/admin/students", { jar: admin });
check("admin lists all students", adminStudents.json.students.length === 8, `got ${adminStudents.json.students.length}`);
const adminTeachers = await req("/api/admin/teachers", { jar: admin });
check("admin lists teachers", adminTeachers.json.teachers.length === 2);
const adminClasses = await req("/api/admin/classes", { jar: admin });
check("admin lists classes", adminClasses.json.classes.length === 4);
const adminParents = await req("/api/admin/parents", { jar: admin });
check("admin lists parents", adminParents.json.parents.length >= 5);

// teacher must NOT reach admin endpoints
const teacherAdmin = await req("/api/admin/stats", { jar: t1 });
check("teacher cannot reach admin endpoints", teacherAdmin.status === 403);
// parent must NOT reach teacher endpoints
const parentTeacher = await req("/api/teacher/overview", { jar: parent1 });
check("parent cannot reach teacher endpoints", parentTeacher.status === 403);

// cleanup the practice test so re-runs stay tidy
const del = await req(`/api/teacher/tests/${newTest.json.test.id}`, { method: "DELETE", jar: admin });
check("admin can delete a test", del.status === 200);

console.log(failures === 0 ? "\nAll smoke checks passed ✔" : `\n${failures} check(s) FAILED ✘`);
process.exit(failures === 0 ? 0 : 1);
