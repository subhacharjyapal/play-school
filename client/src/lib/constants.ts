/**
 * Client-side mirror of server constants. Kept in sync with
 * server/src/lib/constants.ts (the server validates independently).
 */

export const ROLES = ["PARENT", "TEACHER", "ADMIN"] as const;
export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export const PROGRAMS = ["PLAYGROUP", "NURSERY", "LKG", "UKG"] as const;
export const TERMS = ["TERM1", "TERM2", "TERM3"] as const;
export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE"] as const;
export const GALLERY_CATEGORIES = ["EVENT", "CLASSROOM", "SPORTS", "FESTIVAL", "ACTIVITY"] as const;

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

export const SKILLS = [
  { key: "languageRating", label: "Language" },
  { key: "mathRating", label: "Math" },
  { key: "motorRating", label: "Motor Skills" },
  { key: "socialRating", label: "Social Skills" },
  { key: "creativityRating", label: "Creativity" },
  { key: "disciplineRating", label: "Discipline" },
] as const;

export type SkillKey = (typeof SKILLS)[number]["key"];

export const SCHOOL = {
  name: "Little Stars Play School",
  city: "Austin, TX",
  tagline: "Where little minds bloom with joy",
  phone: "+1 (512) 555-0147",
  email: "hello@littlestars.example",
  address: "1420 Sunshine Lane, Austin, TX 78701",
  hours: "Mon – Fri, 8:00 AM – 4:30 PM",
  mapEmbedUrl:
    "https://www.google.com/maps?q=1420+Sunshine+Lane,+Austin,+TX+78701&output=embed",
} as const;

export const PROGRAM_INFO = [
  {
    program: "PLAYGROUP" as const,
    ages: "1.5 – 2.5 years",
    blurb:
      "A gentle first step away from home. Songs, sensory play and lots of cuddles build trust and early social skills.",
  },
  {
    program: "NURSERY" as const,
    ages: "2.5 – 3.5 years",
    blurb:
      "Curiosity blooms with story time, colors, clay play and supervised outdoor exploration.",
  },
  {
    program: "LKG" as const,
    ages: "3.5 – 4.5 years",
    blurb:
      "Pre-reading and pre-math foundations through phonics, number games and collaborative projects.",
  },
  {
    program: "UKG" as const,
    ages: "4.5 – 5.5 years",
    blurb:
      "School-readiness with early writing, simple math, science discovery and confidence-building activities.",
  },
];
