import { pool } from '../../db/pool';

export type ActivityRow = {
  id: string;
  group_id: string;
  actor_id: string;
  type: string;
  payload: unknown;
  created_at: Date;
  group_name?: string;
  actor_name?: string;
};

export async function listActivityForUser(userId: string, limit: number, offset: number) {
  const result = await pool.query<ActivityRow>(
    `SELECT a.id, a.group_id, a.actor_id, a.type, a.payload, a.created_at,
            g.name AS group_name, u.name AS actor_name
     FROM activity_log a
     JOIN group_members gm ON gm.group_id = a.group_id AND gm.user_id = $1
     JOIN groups g ON g.id = a.group_id
     JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows;
}

export async function listActivityForGroup(groupId: string, limit: number, offset: number) {
  const result = await pool.query<ActivityRow>(
    `SELECT a.id, a.group_id, a.actor_id, a.type, a.payload, a.created_at,
            g.name AS group_name, u.name AS actor_name
     FROM activity_log a
     JOIN groups g ON g.id = a.group_id
     JOIN users u ON u.id = a.actor_id
     WHERE a.group_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2 OFFSET $3`,
    [groupId, limit, offset],
  );
  return result.rows;
}

export async function listFriends(userId: string) {
  const result = await pool.query<{
    user_id: string;
    name: string;
    shared_group_count: string;
  }>(
    `SELECT u.id AS user_id, u.name, COUNT(DISTINCT gm2.group_id)::text AS shared_group_count
     FROM group_members gm1
     JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id <> gm1.user_id
     JOIN users u ON u.id = gm2.user_id
     WHERE gm1.user_id = $1
     GROUP BY u.id, u.name
     ORDER BY u.name ASC`,
    [userId],
  );
  return result.rows;
}
