import { prisma } from "../lib/prisma";

/**
 * Server-side authorization helper: can `user` (id + role) access the data
 * of `studentId`?
 *
 * - ADMIN: yes (needs oversight for support/admin tasks)
 * - TEACHER: yes only if the student is in a classroom assigned to them
 * - PARENT: yes only if the student belongs to their parent profile
 *
 * Every parent-facing query goes through this check — ownership is never
 * trusted from client input alone.
 */
export async function canUserAccessStudent(
  user: { id: string; role: string },
  studentId: string
): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      isActive: true,
      parentId: true,
      parent: { select: { userId: true } },
      classroom: { select: { teacherId: true } },
    },
  });
  if (!student) return false;

  if (user.role === "ADMIN") return true;

  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!teacher) return false;
    return student.classroom?.teacherId === teacher.id;
  }

  // PARENT
  return student.parent.userId === user.id;
}

/**
 * Resolves the teacher profile id for a TEACHER user (queries are keyed by
 * teacher profile, not user).
 */
export async function getTeacherProfileId(userId: string): Promise<string | null> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

/** Resolves the parent profile id + its user id for a PARENT user. */
export async function getParentProfile(
  userId: string
): Promise<{ id: string; userId: string } | null> {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  });
  return parent ?? null;
}
