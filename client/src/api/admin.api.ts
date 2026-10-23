import { api } from "./client";
import type { AdminApplication } from "./applications.api";
import type { GalleryImage } from "./gallery.api";
import type { Announcement } from "./public.api";

export interface AdminStats {
  students: number;
  pendingApps: number;
  teachers: number;
  parents: number;
  classes: number;
  messages: number;
}

export interface AdminStudent {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  program: string;
  photoUrl: string | null;
  isActive: boolean;
  parentId: string;
  parent: { id: string; fullName: string; phone: string };
  classroom: { id: string; name: string } | null;
}

export interface AdminParent {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  user: { id: string; email: string; isActive: boolean };
  students: Array<{ id: string; fullName: string; isActive: boolean }>;
}

export interface AdminTeacher {
  id: string;
  fullName: string;
  phone: string | null;
  qualification: string | null;
  bio: string | null;
  photoUrl: string | null;
  user: { id: string; email: string; isActive: boolean };
  classrooms: Array<{ id: string; name: string }>;
}

export interface AdminClass {
  id: string;
  name: string;
  program: string;
  teacher: { id: string; fullName: string } | null;
  _count: { students: number };
}

export async function fetchStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

export async function fetchAdminStudents(): Promise<AdminStudent[]> {
  const { data } = await api.get<{ students: AdminStudent[] }>("/admin/students");
  return data.students;
}

export interface StudentInput {
  fullName: string;
  dob: string;
  gender: string;
  program: string;
  classroomId?: string;
  parentId: string;
  photoUrl?: string;
}

export async function createStudent(input: StudentInput): Promise<void> {
  await api.post("/admin/students", input);
}

export async function updateStudent(id: string, input: Partial<StudentInput>): Promise<void> {
  await api.patch(`/admin/students/${id}`, input);
}

export async function archiveStudent(id: string): Promise<void> {
  await api.post(`/admin/students/${id}/archive`);
}

export async function fetchAdminParents(): Promise<AdminParent[]> {
  const { data } = await api.get<{ parents: AdminParent[] }>("/admin/parents");
  return data.parents;
}

export async function fetchAdminTeachers(): Promise<AdminTeacher[]> {
  const { data } = await api.get<{ teachers: AdminTeacher[] }>("/admin/teachers");
  return data.teachers;
}

export interface TeacherInput {
  fullName: string;
  email: string;
  phone?: string;
  qualification?: string;
  bio?: string;
}

export async function createTeacher(input: TeacherInput): Promise<{ temporaryPassword: string }> {
  const { data } = await api.post<{ temporaryPassword: string }>("/admin/teachers", input);
  return data;
}

export async function toggleTeacherActive(id: string): Promise<boolean> {
  const { data } = await api.post<{ isActive: boolean }>(`/admin/teachers/${id}/toggle-active`);
  return data.isActive;
}

export async function fetchAdminClasses(): Promise<AdminClass[]> {
  const { data } = await api.get<{ classes: AdminClass[] }>("/admin/classes");
  return data.classes;
}

export interface ClassInput {
  name: string;
  program: string;
  teacherId?: string;
}

export async function createClass(input: ClassInput): Promise<void> {
  await api.post("/admin/classes", input);
}

export async function updateClass(id: string, input: Partial<ClassInput>): Promise<void> {
  await api.patch(`/admin/classes/${id}`, input);
}

// Gallery management (admin)
export async function uploadGalleryImage(file: File, title: string, category: string): Promise<GalleryImage> {
  const form = new FormData();
  form.append("image", file);
  form.append("title", title);
  form.append("category", category);
  const { data } = await api.post<{ image: GalleryImage }>("/gallery", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.image;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await api.delete(`/gallery/${id}`);
}

// Announcements management (admin)
export interface AnnouncementInput {
  title: string;
  body: string;
  eventDate?: string | null;
  isActive?: boolean;
}

export async function createAnnouncement(input: AnnouncementInput): Promise<void> {
  await api.post("/announcements", input);
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<void> {
  await api.put(`/announcements/${id}`, input);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/announcements/${id}`);
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchContactMessages(): Promise<ContactMessageRow[]> {
  const { data } = await api.get<{ messages: ContactMessageRow[] }>("/contact");
  return data.messages;
}

export type { AdminApplication, GalleryImage, Announcement };
