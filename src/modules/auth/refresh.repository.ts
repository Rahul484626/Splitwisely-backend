import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export type RefreshRow = {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  expires_at: Date;
  revoked_at: Date | null;
};

export async function insertRefreshToken(
  q: Queryable,
  input: { userId: string; tokenHash: string; familyId: string; expiresAt: Date },
): Promise<void> {
  await q.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
     VALUES ($1, $2, $3::uuid, $4)`,
    [input.userId, input.tokenHash, input.familyId, input.expiresAt],
  );
}

export async function findRefreshByHash(tokenHash: string): Promise<RefreshRow | null> {
  const result = await pool.query<RefreshRow>(
    `SELECT id, user_id, token_hash, family_id, expires_at, revoked_at
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function revokeRefreshById(q: Queryable, id: string): Promise<void> {
  await q.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, [id]);
}

export async function revokeRefreshFamily(q: Queryable, familyId: string): Promise<void> {
  await q.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL`,
    [familyId],
  );
}
