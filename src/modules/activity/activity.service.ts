import { AppError } from '../../middleware/error-handler';
import * as groupsRepo from '../groups/groups.repository';
import * as activityRepo from './activity.repository';

function mapActivity(row: activityRepo.ActivityRow) {
  return {
    id: row.id,
    groupId: row.group_id,
    groupName: row.group_name ?? null,
    actorId: row.actor_id,
    actorName: row.actor_name ?? null,
    type: row.type,
    payload: row.payload,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listMyActivity(userId: string, limit = 50, offset = 0) {
  const rows = await activityRepo.listActivityForUser(userId, limit, offset);
  return { items: rows.map(mapActivity), limit, offset };
}

export async function listGroupActivity(
  actorId: string,
  groupId: string,
  limit = 50,
  offset = 0,
) {
  const membership = await groupsRepo.getMembership(groupId, actorId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }
  const rows = await activityRepo.listActivityForGroup(groupId, limit, offset);
  return { items: rows.map(mapActivity), limit, offset };
}

export async function listFriends(userId: string) {
  const rows = await activityRepo.listFriends(userId);
  return {
    items: rows.map((r) => ({
      userId: r.user_id,
      name: r.name,
      sharedGroupCount: Number(r.shared_group_count),
    })),
  };
}
