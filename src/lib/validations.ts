import { z } from "zod";

// Available Nature Club activity interests
export const INTEREST_AREAS = [
  { id: "hiking", label: "Hiking & Trail Exploration" },
  { id: "bird watching", label: "Bird Watching & Ornithology" },
  { id: "tree planting", label: "Tree Planting & Afforestation" },
  { id: "clean-up", label: "River & Trail Clean-ups" },
  { id: "camping", label: "Wilderness Camping & Bushcraft" },
  { id: "photography", label: "Nature & Wildlife Photography" },
  { id: "education", label: "Environmental Education & Youth Outreach" },
] as const;

export type InterestAreaId = (typeof INTEREST_AREAS)[number]["id"];

/**
 * Calculates a person's age in full years from their date of birth.
 */
export function calculateAge(birthDateInput: string | Date): number {
  const birthDate = new Date(birthDateInput);
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// Regex for international / local phone numbers allowing +, numbers, hyphens, spaces, and parentheses
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,20}$/;

/**
 * Zod schema for public member registration.
 * Includes conditional validation: if the applicant is under 18,
 * guardian details and guardian consent are strictly mandatory.
 */
export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, "Please enter a valid phone number (e.g. +1 555-0199 or 0712345678)"),
    address: z
      .string()
      .trim()
      .min(5, "Address must be at least 5 characters")
      .max(250, "Address is too long"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Invalid date format",
      }),
    gender: z
      .string()
      .optional()
      .nullable(),
    occupation: z
      .string()
      .trim()
      .min(2, "Occupation or school is required")
      .max(100, "Occupation text is too long"),
    membershipTypeId: z
      .string()
      .min(1, "Please choose a membership type"),
    interestAreas: z
      .array(z.string())
      .min(1, "Please select at least one interest area"),
    emergencyContactName: z
      .string()
      .trim()
      .min(2, "Emergency contact name is required"),
    emergencyContactPhone: z
      .string()
      .trim()
      .regex(phoneRegex, "Please enter a valid emergency contact phone number"),
    healthNotes: z
      .string()
      .max(500, "Health notes cannot exceed 500 characters")
      .optional()
      .nullable(),
    photoUrl: z
      .string()
      .optional()
      .nullable(),
    // Minor consent fields
    guardianName: z.string().optional().nullable(),
    guardianPhone: z.string().optional().nullable(),
    guardianConsent: z.boolean().optional(),
    // Rules & Waivers
    agreedToRules: z
      .boolean()
      .refine((val) => val === true, "You must agree to the club rules to join"),
    liabilityWaiver: z
      .boolean()
      .refine((val) => val === true, "You must acknowledge the safety and liability waiver to join"),
  })
  .superRefine((data, ctx) => {
    const age = calculateAge(data.dateOfBirth);
    if (age < 18) {
      if (!data.guardianName || data.guardianName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Parent or guardian name is required for applicants under 18",
          path: ["guardianName"],
        });
      }
      if (!data.guardianPhone || !phoneRegex.test(data.guardianPhone.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A valid parent or guardian phone number is required for applicants under 18",
          path: ["guardianPhone"],
        });
      }
      if (!data.guardianConsent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Parental/guardian consent checkbox must be confirmed for applicants under 18",
          path: ["guardianConsent"],
        });
      }
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
