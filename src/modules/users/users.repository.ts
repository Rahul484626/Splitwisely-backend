import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import type { UserRow } from './user.mapper';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export async function insertUser(
  q: Queryable,
  input: { name: string; email: string; passwordHash: string; defaultCurrency: string },
): Promise<UserRow> {
  const result = await q.query<UserRow>(
    `INSERT INTO users (name, email, password_hash, default_currency)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, default_currency, created_at, deactivated_at`,
    [input.name, input.email.toLowerCase(), input.passwordHash, input.defaultCurrency],
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<(UserRow & { password_hash: string }) | null> {
  const result = await pool.query<UserRow & { password_hash: string }>(
    `SELECT id, name, email, password_hash, default_currency, created_at, deactivated_at
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, name, email, default_currency, created_at, deactivated_at
     FROM users
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function updateUser(
  id: string,
  patch: { name?: string; defaultCurrency?: string },
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `UPDATE users
     SET name = COALESCE($2, name),
         default_currency = COALESCE($3, default_currency),
         updated_at = now()
     WHERE id = $1
     RETURNING id, name, email, default_currency, created_at, deactivated_at`,
    [id, patch.name ?? null, patch.defaultCurrency ?? null],
  );
  return result.rows[0] ?? null;
}
