import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export type GroupRow = {
  id: string;
  name: string;
  created_by: string;
  currency: string;
  created_at: Date;
};

export async function insertGroup(
  q: Queryable,
  input: { name: string; createdBy: string; currency: string },
): Promise<GroupRow> {
  const result = await q.query<GroupRow>(
    `INSERT INTO groups (name, created_by, currency)
     VALUES ($1, $2, $3)
     RETURNING id, name, created_by, currency, created_at`,
    [input.name, input.createdBy, input.currency],
  );
  return result.rows[0];
}

export async function insertMember(
  q: Queryable,
  input: { groupId: string; userId: string; role: 'admin' | 'member' },
): Promise<void> {
  await q.query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, $3)`,
    [input.groupId, input.userId, input.role],
  );
}

export async function insertActivity(
  q: Queryable,
  input: { groupId: string; actorId: string; type: string; payload: unknown },
): Promise<void> {
  await q.query(
    `INSERT INTO activity_log (group_id, actor_id, type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [input.groupId, input.actorId, input.type, JSON.stringify(input.payload)],
  );
}

export async function listGroupsForUser(userId: string) {
  const result = await pool.query<{
    id: string;
    name: string;
    created_by: string;
    currency: string;
    created_at: Date;
    member_count: string;
  }>(
    `SELECT g.id, g.name, g.created_by, g.currency, g.created_at,
            COUNT(gm2.user_id)::text AS member_count
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
     JOIN group_members gm2 ON gm2.group_id = g.id
     GROUP BY g.id
     ORDER BY g.created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function findGroupById(groupId: string): Promise<GroupRow | null> {
  const result = await pool.query<GroupRow>(
    `SELECT id, name, created_by, currency, created_at FROM groups WHERE id = $1`,
    [groupId],
  );
  return result.rows[0] ?? null;
}

export async function getMembership(groupId: string, userId: string) {
  const result = await pool.query<{ role: 'admin' | 'member' }>(
    `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId],
  );
  return result.rows[0] ?? null;
}

export async function listMembers(groupId: string) {
  const result = await pool.query<{
    user_id: string;
    role: string;
    joined_at: Date;
    name: string;
    email: string;
  }>(
    `SELECT gm.user_id, gm.role, gm.joined_at, u.name, u.email
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at ASC`,
    [groupId],
  );
  return result.rows;
}

export async function updateGroupName(groupId: string, name: string): Promise<GroupRow | null> {
  const result = await pool.query<GroupRow>(
    `UPDATE groups SET name = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, name, created_by, currency, created_at`,
    [groupId, name],
  );
  return result.rows[0] ?? null;
}

export async function deleteMember(
  q: Queryable,
  groupId: string,
  userId: string,
): Promise<boolean> {
  const result = await q.query(
    `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function memberExists(groupId: string, userId: string): Promise<boolean> {
  const m = await getMembership(groupId, userId);
  return Boolean(m);
}
