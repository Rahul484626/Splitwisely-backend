import { AppError } from '../../middleware/error-handler';

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export type SplitInput = {
  userId: string;
  shareMinor?: number;
  percentage?: number;
  shares?: number;
};

export type ComputedSplit = {
  userId: string;
  shareMinor: number;
};

/**
 * Distribute leftover paisa: payer first (if participating), then others by userId asc.
 */
export function distributeRemainder(
  userIds: string[],
  baseShares: Map<string, number>,
  remainder: number,
  payerId: string,
): Map<string, number> {
  if (remainder < 0) {
    throw new AppError('VALIDATION_ERROR', 'Remainder cannot be negative', 400);
  }

  const result = new Map(baseShares);
  if (remainder === 0) {
    return result;
  }

  const ordered = [...userIds].sort((a, b) => {
    if (a === payerId && b !== payerId) return -1;
    if (b === payerId && a !== payerId) return 1;
    return a.localeCompare(b);
  });

  for (let i = 0; i < remainder; i += 1) {
    const id = ordered[i % ordered.length];
    result.set(id, (result.get(id) ?? 0) + 1);
  }
  return result;
}

export function computeEqualSplits(
  amountMinor: number,
  participantIds: string[],
  payerId: string,
): ComputedSplit[] {
  if (participantIds.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one participant is required', 400);
  }
  const unique = [...new Set(participantIds)];
  if (unique.length !== participantIds.length) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate participants', 400);
  }

  const n = unique.length;
  const base = Math.floor(amountMinor / n);
  const remainder = amountMinor - base * n;
  const baseShares = new Map(unique.map((id) => [id, base]));
  const finalShares = distributeRemainder(unique, baseShares, remainder, payerId);

  return unique.map((userId) => ({
    userId,
    shareMinor: finalShares.get(userId)!,
  }));
}

export function computeWeightedSplits(
  amountMinor: number,
  entries: { userId: string; weight: number }[],
  payerId: string,
): ComputedSplit[] {
  if (entries.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one split entry is required', 400);
  }
  const ids = entries.map((e) => e.userId);
  if (new Set(ids).size !== ids.length) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate split users', 400);
  }
  if (entries.some((e) => !Number.isFinite(e.weight) || e.weight < 0)) {
    throw new AppError('VALIDATION_ERROR', 'Weights must be non-negative numbers', 400);
  }
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Total weight must be greater than zero', 400);
  }

  const floors = new Map<string, number>();
  let assigned = 0;
  for (const entry of entries) {
    const share = Math.floor((amountMinor * entry.weight) / totalWeight);
    floors.set(entry.userId, share);
    assigned += share;
  }
  const remainder = amountMinor - assigned;
  const finalShares = distributeRemainder(ids, floors, remainder, payerId);

  return ids.map((userId) => ({
    userId,
    shareMinor: finalShares.get(userId)!,
  }));
}

export function computeExactSplits(
  amountMinor: number,
  entries: { userId: string; shareMinor: number }[],
): ComputedSplit[] {
  if (entries.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one split entry is required', 400);
  }
  const ids = entries.map((e) => e.userId);
  if (new Set(ids).size !== ids.length) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate split users', 400);
  }
  if (entries.some((e) => !Number.isInteger(e.shareMinor) || e.shareMinor < 0)) {
    throw new AppError('VALIDATION_ERROR', 'shareMinor must be a non-negative integer', 400);
  }
  const sum = entries.reduce((s, e) => s + e.shareMinor, 0);
  if (sum !== amountMinor) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Splits must sum to amountMinor (${amountMinor}), got ${sum}`,
      400,
    );
  }
  return entries.map((e) => ({ userId: e.userId, shareMinor: e.shareMinor }));
}

export function assertSplitsSum(amountMinor: number, splits: ComputedSplit[]): void {
  const sum = splits.reduce((s, x) => s + x.shareMinor, 0);
  if (sum !== amountMinor) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Internal split sum mismatch: expected ${amountMinor}, got ${sum}`,
      400,
    );
  }
}

export function computeSplits(input: {
  amountMinor: number;
  splitType: SplitType;
  payerId: string;
  participants?: string[];
  splits?: SplitInput[];
}): ComputedSplit[] {
  const { amountMinor, splitType, payerId, participants, splits } = input;
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new AppError('VALIDATION_ERROR', 'amountMinor must be a positive integer', 400);
  }

  let computed: ComputedSplit[];
  switch (splitType) {
    case 'equal': {
      if (!participants?.length) {
        throw new AppError('VALIDATION_ERROR', 'participants required for equal split', 400);
      }
      computed = computeEqualSplits(amountMinor, participants, payerId);
      break;
    }
    case 'exact': {
      if (!splits?.length) {
        throw new AppError('VALIDATION_ERROR', 'splits required for exact split', 400);
      }
      computed = computeExactSplits(
        amountMinor,
        splits.map((s) => ({ userId: s.userId, shareMinor: s.shareMinor ?? -1 })),
      );
      break;
    }
    case 'percentage': {
      if (!splits?.length) {
        throw new AppError('VALIDATION_ERROR', 'splits required for percentage split', 400);
      }
      computed = computeWeightedSplits(
        amountMinor,
        splits.map((s) => ({ userId: s.userId, weight: s.percentage ?? -1 })),
        payerId,
      );
      break;
    }
    case 'shares': {
      if (!splits?.length) {
        throw new AppError('VALIDATION_ERROR', 'splits required for shares split', 400);
      }
      computed = computeWeightedSplits(
        amountMinor,
        splits.map((s) => ({ userId: s.userId, weight: s.shares ?? -1 })),
        payerId,
      );
      break;
    }
    default:
      throw new AppError('VALIDATION_ERROR', 'Invalid splitType', 400);
  }

  assertSplitsSum(amountMinor, computed);
  return computed;
}
