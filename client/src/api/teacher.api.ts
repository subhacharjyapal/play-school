import { api } from "./client";

export interface TeacherClassroom {
  id: string;
  name: string;
  program: string;
  studentCount: number;
  students: Array<{
    id: string;
    fullName: string;
    program: string;
    photoUrl: string | null;
    dob: string;
  }>;
}

export interface TeacherTest {
  id: string;
  title: string;
  subject: string;
  date: string;
  maxMarks: number;
  term: string;
  academicYear: string;
  classroom: { id: string; name: string };
  _count: { results: number };
}

export interface TestRow {
  studentId: string;
  studentName: string;
  photoUrl: string | null;
  marksObtained: number | null;
  grade: string | null;
  remarks: string | null;
}

export interface TestInput {
  title: string;
  subject: string;
  date: string;
  maxMarks: number;
  term: string;
  academicYear: string;
  classroomId: string;
}

export async function fetchOverview(): Promise<TeacherClassroom[]> {
  const { data } = await api.get<{ classrooms: TeacherClassroom[] }>("/teacher/overview");
  return data.classrooms;
}

export async function fetchTests(classroomId?: string): Promise<TeacherTest[]> {
  const { data } = await api.get<{ tests: TeacherTest[] }>("/teacher/tests", {
    params: classroomId ? { classroomId } : undefined,
  });
  return data.tests;
}

export async function createTest(input: TestInput): Promise<TeacherTest> {
  const { data } = await api.post<{ test: TeacherTest }>("/teacher/tests", input);
  return data.test;
}

export async function deleteTest(id: string): Promise<void> {
  await api.delete(`/teacher/tests/${id}`);
}

export async function fetchTestRows(testId: string): Promise<TestRow[]> {
  const { data } = await api.get<{ rows: TestRow[] }>(`/teacher/tests/${testId}/results`);
  return data.rows;
}

export async function saveResult(
  testId: string,
  studentId: string,
  marksObtained: number,
  remarks?: string
): Promise<void> {
  await api.put(`/teacher/tests/${testId}/results`, { studentId, marksObtained, remarks });
}

export interface ProgressInput {
  studentId: string;
  term: string;
  academicYear: string;
  attendancePct: number;
  languageRating: number;
  mathRating: number;
  motorRating: number;
  socialRating: number;
  creativityRating: number;
  disciplineRating: number;
  teacherRemarks?: string;
}

export async function saveProgress(input: ProgressInput): Promise<void> {
  await api.put("/teacher/progress", input);
}

export async function fetchStudentProgress(studentId: string) {
  const { data } = await api.get<{
    reports: Array<{
      id: string;
      term: string;
      academicYear: string;
      attendancePct: number;
      ratings: Record<string, number>;
      teacherRemarks: string | null;
      teacherName: string | null;
    }>;
  }>(`/students/${studentId}/progress`);
  return data.reports;
}

export interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
}

export async function markAttendance(
  classroomId: string,
  date: string,
  records: AttendanceRecord[]
): Promise<number> {
  const { data } = await api.post<{ saved: number }>("/teacher/attendance", {
    classroomId,
    date,
    records,
  });
  return data.saved;
}
