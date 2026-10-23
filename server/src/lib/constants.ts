/**
 * Shared constants. These mirror the Prisma schema's string "enums" and are
 * validated with Zod on both client and server.
 */

export const ROLES = ["PARENT", "TEACHER", "ADMIN"] as const;
export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export const PROGRAMS = ["PLAYGROUP", "NURSERY", "LKG", "UKG"] as const;
export const TERMS = ["TERM1", "TERM2", "TERM3"] as const;
export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE"] as const;
export const GALLERY_CATEGORIES = ["EVENT", "CLASSROOM", "SPORTS", "FESTIVAL", "ACTIVITY"] as const;
export const SKILL_RATINGS_MIN = 1;
export const SKILL_RATINGS_MAX = 5;

export const SKILLS = [
  { key: "languageRating", label: "Language" },
  { key: "mathRating", label: "Math" },
  { key: "motorRating", label: "Motor Skills" },
  { key: "socialRating", label: "Social Skills" },
  { key: "creativityRating", label: "Creativity" },
  { key: "disciplineRating", label: "Discipline" },
] as const;

export const PROGRAM_LABELS: Record<(typeof PROGRAMS)[number], string> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  LKG: "LKG",
  UKG: "UKG",
};

export const TERM_LABELS: Record<(typeof TERMS)[number], string> = {
  TERM1: "Term 1",
  TERM2: "Term 2",
  TERM3: "Term 3",
};

export const GALLERY_CATEGORY_LABELS: Record<(typeof GALLERY_CATEGORIES)[number], string> = {
  EVENT: "Events",
  CLASSROOM: "Classroom",
  SPORTS: "Sports Day",
  FESTIVAL: "Festivals",
  ACTIVITY: "Activities",
};

export const SCHOOL = {
  name: "Little Stars Play School",
  city: "Austin, TX",
  tagline: "Where little minds bloom with joy",
  phone: "+1 (512) 555-0147",
  email: "hello@littlestars.example",
  address: "1420 Sunshine Lane, Austin, TX 78701",
  hours: "Mon – Fri, 8:00 AM – 4:30 PM",
} as const;

/** Grade boundaries based on percentage of max marks. */
export function computeGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 40) return "D";
  return "E";
}
