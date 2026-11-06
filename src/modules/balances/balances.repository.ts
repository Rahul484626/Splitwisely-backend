import { pool } from '../../db/pool';

export type NetRow = {
  user_id: string;
  net_minor: string;
};

const NET_BALANCE_SQL = `
WITH expense_impact AS (
  SELECT e.paid_by AS user_id, SUM(e.amount_minor) AS paid
  FROM expenses e
  WHERE e.group_id = $1 AND e.deleted_at IS NULL
  GROUP BY e.paid_by
),
split_impact AS (
  SELECT s.user_id, SUM(s.share_minor) AS owed
  FROM expense_splits s
  JOIN expenses e ON e.id = s.expense_id
  WHERE e.group_id = $1 AND e.deleted_at IS NULL
  GROUP BY s.user_id
),
-- Settlements: from_user pays to_user.
-- Positive net = you are owed. Paying reduces debt (+), receiving reduces credit (−).
settlement_impact AS (
  SELECT from_user AS user_id, SUM(amount_minor) AS delta
  FROM settlements WHERE group_id = $1
  GROUP BY from_user
  UNION ALL
  SELECT to_user AS user_id, -SUM(amount_minor) AS delta
  FROM settlements WHERE group_id = $1
  GROUP BY to_user
),
settlement_net AS (
  SELECT user_id, SUM(delta) AS settled
  FROM settlement_impact
  GROUP BY user_id
)
SELECT
  gm.user_id,
  (COALESCE(ei.paid, 0) - COALESCE(si.owed, 0) + COALESCE(sn.settled, 0))::text AS net_minor
FROM group_members gm
LEFT JOIN expense_impact ei ON ei.user_id = gm.user_id
LEFT JOIN split_impact si ON si.user_id = gm.user_id
LEFT JOIN settlement_net sn ON sn.user_id = gm.user_id
WHERE gm.group_id = $1
`;

export async function netBalancesForGroup(groupId: string): Promise<NetRow[]> {
  const result = await pool.query<NetRow>(NET_BALANCE_SQL, [groupId]);
  return result.rows;
}

/** Net for one user across all their groups. */
export async function netBalancesForUserAcrossGroups(userId: string) {
  const result = await pool.query<{ group_id: string; net_minor: string }>(
    `
    WITH my_groups AS (
      SELECT group_id FROM group_members WHERE user_id = $1
    ),
    expense_impact AS (
      SELECT e.group_id, e.paid_by AS user_id, SUM(e.amount_minor) AS paid
      FROM expenses e
      JOIN my_groups mg ON mg.group_id = e.group_id
      WHERE e.deleted_at IS NULL
      GROUP BY e.group_id, e.paid_by
    ),
    split_impact AS (
      SELECT e.group_id, s.user_id, SUM(s.share_minor) AS owed
      FROM expense_splits s
      JOIN expenses e ON e.id = s.expense_id
      JOIN my_groups mg ON mg.group_id = e.group_id
      WHERE e.deleted_at IS NULL
      GROUP BY e.group_id, s.user_id
    ),
    settlement_impact AS (
      SELECT group_id, from_user AS user_id, SUM(amount_minor) AS delta
      FROM settlements
      WHERE group_id IN (SELECT group_id FROM my_groups)
      GROUP BY group_id, from_user
      UNION ALL
      SELECT group_id, to_user AS user_id, -SUM(amount_minor) AS delta
      FROM settlements
      WHERE group_id IN (SELECT group_id FROM my_groups)
      GROUP BY group_id, to_user
    ),
    settlement_net AS (
      SELECT group_id, user_id, SUM(delta) AS settled
      FROM settlement_impact
      GROUP BY group_id, user_id
    )
    SELECT
      gm.group_id,
      (COALESCE(ei.paid, 0) - COALESCE(si.owed, 0) + COALESCE(sn.settled, 0))::text AS net_minor
    FROM group_members gm
    LEFT JOIN expense_impact ei ON ei.group_id = gm.group_id AND ei.user_id = gm.user_id
    LEFT JOIN split_impact si ON si.group_id = gm.group_id AND si.user_id = gm.user_id
    LEFT JOIN settlement_net sn ON sn.group_id = gm.group_id AND sn.user_id = gm.user_id
    WHERE gm.user_id = $1
    `,
    [userId],
  );
  return result.rows;
}
