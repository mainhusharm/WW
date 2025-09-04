import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
  questionnaire: z.object({
    experience: z.string(),
    goals: z.string(),
    preferences: z.string(),
  }).optional(),
  screenshot: z.string().url().optional().or(z.literal('')),
  riskManagementPlan: z.string().optional(),
});

export const StatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED']),
});

export const UserUpdateSchema = z.object({
  fullName: z.string().optional(),
  questionnaireData: z.object({
    experience: z.string(),
    goals: z.string(),
    preferences: z.string(),
  }).optional(),
  screenshotUrl: z.string().url().optional().or(z.literal('')),
  riskManagementPlan: z.string().optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
