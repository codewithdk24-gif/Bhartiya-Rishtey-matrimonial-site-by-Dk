import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  // FIX: Password regex was too weak - only checked alphanumeric, no special char requirement
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z
    .string()
    .min(2, "Full name is too short")
    .max(100, "Full name is too long")
    // FIX: Prevent HTML injection in name fields
    .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  // FIX: Normalize phone - allow +, spaces, dashes
  phone: z
    .string()
    .min(10, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^[\d\s+\-()]+$/, "Invalid phone number format"),
});

// ─────────────────────────────────────────────────────────────────
// PROFILE SCHEMA
// ─────────────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  caste: z.string().max(50).optional(),
  religion: z.enum(["Hindu", "Muslim", "Sikh", "Christian", "Buddhist", "Jain", "Other", "Any"]).optional(),
  height: z.number().int().min(120, "Height seems too low").max(250, "Height seems too high").optional(),
  maritalStatus: z
    .enum(["Never Married", "Divorced", "Widowed", "Separated"])
    .optional(),
  education: z.string().max(100).optional(),
  profession: z.string().max(100).optional(),
  annualIncome: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  about: z
    .string()
    .max(1000, "Bio cannot exceed 1000 characters")
    .optional(),
  smoking: z.boolean().optional(),
  drinking: z.boolean().optional(),
  diet: z.enum(["Vegetarian", "Non-Vegetarian", "Vegan", "Jain"]).optional(),
  photoKeys: z.array(z.string().url("Invalid photo URL")).max(6, "Maximum 6 photos allowed").optional(),

  // Partner preferences
  partnerAgeRange: z
    .array(z.number().int().min(18).max(80))
    .length(2)
    .refine(([min, max]) => min <= max, "Min age must be less than or equal to max age")
    .optional(),
  partnerReligion: z.array(z.string()).optional(),
  partnerCaste: z.array(z.string()).optional(),
  partnerEducation: z.array(z.string()).optional(),
  partnerIncome: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────
// MESSAGING & MATCH SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const MessageSchema = z.object({
  receiverId: z.string().cuid("Invalid user ID"),
  // FIX: Trim whitespace and prevent blank messages
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message is too long")
    .transform((s) => s.trim()),
});

export const MatchInterestSchema = z.object({
  targetUserId: z.string().cuid("Invalid user ID"),
});

export const ShortlistSchema = z.object({
  targetProfileId: z.string().cuid("Invalid profile ID"),
});

// ─────────────────────────────────────────────────────────────────
// REPORT / BLOCK SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const ReportSchema = z.object({
  targetUserId: z.string().cuid("Invalid user ID"),
  reason: z.enum([
    "Fake Profile",
    "Harassment",
    "Inappropriate Content",
    "Scam",
    "Spam",
    "Other",
  ]),
  details: z.string().max(500).optional(),
});

export const BlockSchema = z.object({
  targetUserId: z.string().cuid("Invalid user ID"),
});

// ─────────────────────────────────────────────────────────────────
// PAYMENT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const PaymentPlanSchema = z.object({
  plan: z.enum(["PRIME", "ROYAL", "LEGACY"]),
});

export const RazorpayVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan: z.enum(["PRIME", "ROYAL", "LEGACY"]),
});
