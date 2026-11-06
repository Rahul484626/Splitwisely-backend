import { z } from 'zod';

export const patchMeSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    defaultCurrency: z.string().trim().min(3).max(3).optional(),
  })
  .refine((v) => v.name !== undefined || v.defaultCurrency !== undefined, {
    message: 'At least one field is required',
  });
