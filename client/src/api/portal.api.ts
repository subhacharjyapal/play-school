import { api } from "./client";

export interface Child {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  program: string;
  photoUrl: string | null;
  className: string | null;
  teacherName: string | null;
}

export interface ProgressReport {
  id: string;
  term: string;
  academicYear: string;
  attendancePct: number;
  ratings: {
    language: number;
    math: number;
    motor: number;
    social: number;
    creativity: number;
    discipline: number;
  };
  teacherRemarks: string | null;
  teacherName: string | null;
}

export interface TestResultRow {
  id: string;
  testId: string;
  title: string;
  subject: string;
  date: string;
  term: string;
  academicYear: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  remarks: string | null;
  percentage: number;
}

export async function fetchChildren(): Promise<Child[]> {
  const { data } = await api.get<{ children: Child[] }>("/children");
  return data.children;
}

export async function fetchProgress(studentId: string): Promise<ProgressReport[]> {
  const { data } = await api.get<{ reports: ProgressReport[] }>(`/students/${studentId}/progress`);
  return data.reports;
}

export async function fetchResults(studentId: string): Promise<TestResultRow[]> {
  const { data } = await api.get<{ results: TestResultRow[] }>(`/students/${studentId}/results`);
  return data.results;
}

export interface ParentProfile {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  emergencyContact: string | null;
}

export async function updateProfile(
  input: Omit<ParentProfile, "id" | "emergencyContact"> & { emergencyContact?: string | null }
): Promise<ParentProfile> {
  const { data } = await api.patch<{ parent: ParentProfile }>("/profile", input);
  return data.parent;
}

export async function fetchProfile(): Promise<ParentProfile> {
  const { data } = await api.get<{ parent: ParentProfile }>("/profile");
  return data.parent;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post("/change-password", { currentPassword, newPassword });
}

/** Builds the PDF download URL; browser fetches it with cookies attached. */
export function reportCardUrl(studentId: string, term?: string, year?: string): string {
  const params = new URLSearchParams();
  if (term) params.set("term", term);
  if (year) params.set("year", year);
  const qs = params.toString();
  return `/api/students/${studentId}/report-card${qs ? `?${qs}` : ""}`;
}

/** Downloads the report card as a PDF using the session cookie. */
export async function downloadReportCard(studentId: string, filename: string, term?: string, year?: string) {
  const res = await api.get(reportCardUrl(studentId, term, year), { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
