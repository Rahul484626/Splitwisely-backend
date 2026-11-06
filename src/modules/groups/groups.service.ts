import { withTransaction } from '../../db/transaction';
import { AppError } from '../../middleware/error-handler';
import * as balancesService from '../balances/balances.service';
import * as usersRepo from '../users/users.repository';
import * as groupsRepo from './groups.repository';

function toGroupSummary(
  row: {
    id: string;
    name: string;
    created_by: string;
    currency: string;
    created_at: Date;
    member_count: string;
  },
  myNetMinor = 0,
) {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    createdBy: row.created_by,
    myNetMinor,
    memberCount: Number(row.member_count),
    createdAt: row.created_at.toISOString(),
  };
}

export async function createGroup(userId: string, input: { name: string; currency: string }) {
  return withTransaction(async (client) => {
    const group = await groupsRepo.insertGroup(client, {
      name: input.name,
      createdBy: userId,
      currency: input.currency.toUpperCase(),
    });
    await groupsRepo.insertMember(client, { groupId: group.id, userId, role: 'admin' });
    await groupsRepo.insertActivity(client, {
      groupId: group.id,
      actorId: userId,
      type: 'group.created',
      payload: { name: group.name },
    });

    return {
      id: group.id,
      name: group.name,
      currency: group.currency,
      createdBy: group.created_by,
      myNetMinor: 0,
      memberCount: 1,
      createdAt: group.created_at.toISOString(),
    };
  });
}

export async function listGroups(userId: string) {
  const rows = await groupsRepo.listGroupsForUser(userId);
  const nets = await balancesService.netsByGroupForUser(userId);
  return {
    items: rows.map((row) => toGroupSummary(row, nets.get(row.id) ?? 0)),
  };
}

export async function getGroup(userId: string, groupId: string) {
  const membership = await groupsRepo.getMembership(groupId, userId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }

  const group = await groupsRepo.findGroupById(groupId);
  if (!group) {
    throw new AppError('NOT_FOUND', 'Group not found', 404);
  }

  const [members, balances] = await Promise.all([
    groupsRepo.listMembers(groupId),
    balancesService.getGroupBalances(userId, groupId),
  ]);
  const myNet = balances.members.find((m) => m.userId === userId)?.netMinor ?? 0;

  return {
    id: group.id,
    name: group.name,
    currency: group.currency,
    createdBy: group.created_by,
    myNetMinor: myNet,
    memberCount: members.length,
    createdAt: group.created_at.toISOString(),
    members: members.map((m) => ({
      userId: m.user_id,
      name: m.name,
      email: m.email,
      role: m.role,
      joinedAt: m.joined_at.toISOString(),
      netMinor: balances.members.find((b) => b.userId === m.user_id)?.netMinor ?? 0,
    })),
    simplified: balances.simplified,
  };
}

export async function renameGroup(userId: string, groupId: string, name: string) {
  const membership = await groupsRepo.getMembership(groupId, userId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }
  if (membership.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Admin role required', 403);
  }

  const updated = await groupsRepo.updateGroupName(groupId, name);
  if (!updated) {
    throw new AppError('NOT_FOUND', 'Group not found', 404);
  }

  return {
    id: updated.id,
    name: updated.name,
    currency: updated.currency,
    createdBy: updated.created_by,
    myNetMinor: 0,
    memberCount: (await groupsRepo.listMembers(groupId)).length,
    createdAt: updated.created_at.toISOString(),
  };
}

export async function addMemberByEmail(actorId: string, groupId: string, email: string) {
  const membership = await groupsRepo.getMembership(groupId, actorId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }
  if (membership.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Admin role required', 403);
  }

  const user = await usersRepo.findUserByEmail(email);
  if (!user || user.deactivated_at) {
    throw new AppError('NOT_FOUND', 'User not found for email', 404);
  }

  if (await groupsRepo.memberExists(groupId, user.id)) {
    throw new AppError('CONFLICT', 'User is already a member', 409);
  }

  await withTransaction(async (client) => {
    await groupsRepo.insertMember(client, { groupId, userId: user.id, role: 'member' });
    await groupsRepo.insertActivity(client, {
      groupId,
      actorId,
      type: 'member.added',
      payload: { userId: user.id },
    });
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: 'member',
  };
}

export async function removeMember(
  actorId: string,
  groupId: string,
  targetUserId: string,
  force = false,
) {
  const actorMembership = await groupsRepo.getMembership(groupId, actorId);
  if (!actorMembership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }

  const leavingSelf = actorId === targetUserId;
  if (!leavingSelf && actorMembership.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Admin role required', 403);
  }

  const targetMembership = await groupsRepo.getMembership(groupId, targetUserId);
  if (!targetMembership) {
    throw new AppError('NOT_FOUND', 'Member not found', 404);
  }

  // Phase 2: no expenses yet; net is always 0. force reserved for later.
  void force;

  const group = await groupsRepo.findGroupById(groupId);
  if (group?.created_by === targetUserId) {
    const members = await groupsRepo.listMembers(groupId);
    if (members.length > 1) {
      throw new AppError('VALIDATION_ERROR', 'Transfer ownership or remove other members first', 400);
    }
  }

  await withTransaction(async (client) => {
    await groupsRepo.deleteMember(client, groupId, targetUserId);
    await groupsRepo.insertActivity(client, {
      groupId,
      actorId,
      type: 'member.removed',
      payload: { userId: targetUserId },
    });
  });
}
