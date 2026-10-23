import { z } from "zod";
import { PROGRAMS, GENDERS, GALLERY_CATEGORIES } from "./constants";

/** Reusable field schemas (client side; server re-validates independently). */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .regex(/^[+0-9()\-.\s]+$/, "Phone can only contain digits, spaces, + ( ) - .");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(2000, "Message is too long"),
});

export const applicationSchema = z.object({
  childFullName: z.string().trim().min(2, "Child's full name is required"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
    }, "Date of birth must be in the past"),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: "Please select an option" }) }),
  program: z.enum(PROGRAMS, { errorMap: () => ({ message: "Please select a program" }) }),
  parentName: z.string().trim().min(2, "Parent/guardian name is required"),
  relationship: z.string().trim().min(2, "Please tell us your relationship to the child"),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().trim().min(5, "Please enter the full address"),
  emergencyContact: z
    .string()
    .trim()
    .min(7, "Emergency contact number is required")
    .regex(/^[+0-9()\-.\s]+$/, "Phone can only contain digits, spaces, + ( ) - ."),
  medicalNotes: z.string().trim().max(1000, "Please keep this under 1000 characters").optional(),
  message: z.string().trim().max(2000, "Message is too long").optional(),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  phone: phoneSchema,
  address: z.string().trim().min(5, "Please enter the full address"),
  emergencyContact: z.string().trim().max(30).optional().or(z.literal("")),
});

export const galleryImageMetaSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  category: z.enum(GALLERY_CATEGORIES, {
    errorMap: () => ({ message: "Please select a category" }),
  }),
});

/** Turn a ZodError into a { field: message } map for inline form errors. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Validate a value; returns either parsed data or a field->message map. */
export function validateWith<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): { ok: true; data: z.infer<T> } | { ok: false; errors: Record<string, string> } {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, errors: zodFieldErrors(result.error) };
}
