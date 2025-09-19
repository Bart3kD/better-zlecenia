import { z } from 'zod';

export const onboardingSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  
  confirmPassword: z
    .string(),
  
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
  
  avatar_url: z
    .url('Invalid URL')
    .optional(),
  
  grade_level: z
    .enum(['1', '2', '3', '4', '5'], 'Please select a grade level')

}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type OnboardingData = z.infer<typeof onboardingSchema>;