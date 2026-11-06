import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import type { ComputedSplit } from './split.service';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export type ExpenseRow = {
  id: string;
  group_id: string;
  paid_by: string;
  amount_minor: string;
  currency: string;
  description: string;
  split_type: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export async function insertExpense(
  q: Queryable,
  input: {
    groupId: string;
    paidBy: string;
    amountMinor: number;
    currency: string;
    description: string;
    splitType: string;
  },
): Promise<ExpenseRow> {
  const result = await q.query<ExpenseRow>(
    `INSERT INTO expenses (group_id, paid_by, amount_minor, currency, description, split_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, group_id, paid_by, amount_minor::text, currency, description, split_type,
               created_at, updated_at, deleted_at`,
    [
      input.groupId,
      input.paidBy,
      input.amountMinor,
      input.currency,
      input.description,
      input.splitType,
    ],
  );
  return result.rows[0];
}

export async function replaceSplits(
  q: Queryable,
  expenseId: string,
  splits: ComputedSplit[],
): Promise<void> {
  await q.query(`DELETE FROM expense_splits WHERE expense_id = $1`, [expenseId]);
  for (const split of splits) {
    await q.query(
      `INSERT INTO expense_splits (expense_id, user_id, share_minor)
       VALUES ($1, $2, $3)`,
      [expenseId, split.userId, split.shareMinor],
    );
  }
}

export async function listExpenses(groupId: string, includeDeleted: boolean) {
  const result = await pool.query<ExpenseRow>(
    `SELECT id, group_id, paid_by, amount_minor::text, currency, description, split_type,
            created_at, updated_at, deleted_at
     FROM expenses
     WHERE group_id = $1
       AND ($2::boolean OR deleted_at IS NULL)
     ORDER BY created_at DESC`,
    [groupId, includeDeleted],
  );
  return result.rows;
}

export async function findExpense(groupId: string, expenseId: string): Promise<ExpenseRow | null> {
  const result = await pool.query<ExpenseRow>(
    `SELECT id, group_id, paid_by, amount_minor::text, currency, description, split_type,
            created_at, updated_at, deleted_at
     FROM expenses
     WHERE group_id = $1 AND id = $2`,
    [groupId, expenseId],
  );
  return result.rows[0] ?? null;
}

export async function listSplits(expenseId: string) {
  const result = await pool.query<{ user_id: string; share_minor: string }>(
    `SELECT user_id, share_minor::text FROM expense_splits WHERE expense_id = $1`,
    [expenseId],
  );
  return result.rows;
}

export async function listSplitsForExpenses(expenseIds: string[]) {
  if (expenseIds.length === 0) {
    return [] as { expense_id: string; user_id: string; share_minor: string }[];
  }
  const result = await pool.query<{ expense_id: string; user_id: string; share_minor: string }>(
    `SELECT expense_id, user_id, share_minor::text
     FROM expense_splits
     WHERE expense_id = ANY($1::uuid[])`,
    [expenseIds],
  );
  return result.rows;
}

export async function updateExpense(
  q: Queryable,
  expenseId: string,
  input: {
    paidBy: string;
    amountMinor: number;
    description: string;
    splitType: string;
  },
): Promise<ExpenseRow | null> {
  const result = await q.query<ExpenseRow>(
    `UPDATE expenses
     SET paid_by = $2,
         amount_minor = $3,
         description = $4,
         split_type = $5,
         updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, group_id, paid_by, amount_minor::text, currency, description, split_type,
               created_at, updated_at, deleted_at`,
    [expenseId, input.paidBy, input.amountMinor, input.description, input.splitType],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteExpense(q: Queryable, expenseId: string): Promise<boolean> {
  const result = await q.query(
    `UPDATE expenses
     SET deleted_at = now(), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [expenseId],
  );
  return (result.rowCount ?? 0) > 0;
}
