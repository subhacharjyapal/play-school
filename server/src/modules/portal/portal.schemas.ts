import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .regex(/^[+0-9()\-.\s]+$/, "Phone can only contain digits, spaces, + ( ) - .");

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(120),
  phone,
  address: z.string().trim().min(5, "Please enter the full address").max(500),
  emergencyContact: z.string().trim().max(30).optional().or(z.literal("")),
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
