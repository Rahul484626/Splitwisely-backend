import { z } from 'zod';

export const createSettlementSchema = z
  .object({
    fromUserId: z.string().uuid(),
    toUserId: z.string().uuid(),
    amountMinor: z.number().int().positive(),
    note: z.string().trim().max(500).default(''),
  })
  .refine((v) => v.fromUserId !== v.toUserId, {
    message: 'fromUserId and toUserId must differ',
    path: ['toUserId'],
  });
