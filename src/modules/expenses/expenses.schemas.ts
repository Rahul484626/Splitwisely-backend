import { z } from 'zod';

const splitEntrySchema = z.object({
  userId: z.string().uuid(),
  shareMinor: z.number().int().nonnegative().optional(),
  percentage: z.number().nonnegative().optional(),
  shares: z.number().nonnegative().optional(),
});

export const expenseBodySchema = z
  .object({
    description: z.string().trim().max(500).default(''),
    amountMinor: z.number().int().positive(),
    paidBy: z.string().uuid(),
    splitType: z.enum(['equal', 'exact', 'percentage', 'shares']),
    participants: z.array(z.string().uuid()).optional(),
    splits: z.array(splitEntrySchema).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.splitType === 'equal' && (!val.participants || val.participants.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['participants'],
        message: 'participants required for equal split',
      });
    }
    if (val.splitType !== 'equal' && (!val.splits || val.splits.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['splits'],
        message: 'splits required for this split type',
      });
    }
  });

export type ExpenseBody = z.infer<typeof expenseBodySchema>;
