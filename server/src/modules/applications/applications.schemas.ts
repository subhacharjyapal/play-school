import { z } from "zod";
import { PROGRAMS, GENDERS } from "../../lib/constants";

export const applicationInputSchema = z.object({
  childFullName: z.string().trim().min(2, "Child's full name is required").max(120),
  dob: z.coerce
    .date({
      errorMap: () => ({ message: "Date of birth must be a valid date" }),
    })
    .refine((d) => d.getTime() < Date.now(), "Date of birth must be in the past")
    .refine(
      (d) => d.getTime() > Date.now() - 10 * 365 * 24 * 60 * 60 * 1000,
      "Child's age looks unusual for a play school"
    ),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: "Please select an option" }) }),
  program: z.enum(PROGRAMS, { errorMap: () => ({ message: "Please select a program" }) }),
  parentName: z.string().trim().min(2, "Parent/guardian name is required").max(120),
  relationship: z.string().trim().min(2, "Please tell us your relationship to the child").max(60),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^[+0-9()\-.\s]+$/, "Phone can only contain digits, spaces, + ( ) - ."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  address: z.string().trim().min(5, "Please enter the full address").max(500),
  emergencyContact: z
    .string()
    .trim()
    .min(7, "Emergency contact number is required")
    .max(20)
    .regex(/^[+0-9()\-.\s]+$/, "Phone can only contain digits, spaces, + ( ) - ."),
  medicalNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "Status must be APPROVED or REJECTED" }),
  }),
});
