import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export type SettlementRow = {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount_minor: string;
  note: string;
  created_at: Date;
};

export async function insertSettlement(
  q: Queryable,
  input: {
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amountMinor: number;
    note: string;
  },
): Promise<SettlementRow> {
  const result = await q.query<SettlementRow>(
    `INSERT INTO settlements (group_id, from_user, to_user, amount_minor, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, group_id, from_user, to_user, amount_minor::text, note, created_at`,
    [input.groupId, input.fromUserId, input.toUserId, input.amountMinor, input.note],
  );
  return result.rows[0];
}

export async function listSettlements(groupId: string, limit: number, offset: number) {
  const result = await pool.query<SettlementRow>(
    `SELECT id, group_id, from_user, to_user, amount_minor::text, note, created_at
     FROM settlements
     WHERE group_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [groupId, limit, offset],
  );
  return result.rows;
}
