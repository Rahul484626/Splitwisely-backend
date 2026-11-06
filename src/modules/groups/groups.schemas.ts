import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  currency: z.string().trim().min(3).max(3).default('INR'),
});

export const patchGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const addMemberSchema = z.object({
  email: z.string().trim().email().max(255),
});
