import { withTransaction } from '../../db/transaction';
import { AppError } from '../../middleware/error-handler';
import * as groupsRepo from '../groups/groups.repository';
import * as settlementsRepo from './settlements.repository';

function mapSettlement(row: settlementsRepo.SettlementRow) {
  return {
    id: row.id,
    groupId: row.group_id,
    fromUserId: row.from_user,
    toUserId: row.to_user,
    amountMinor: Number(row.amount_minor),
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createSettlement(
  actorId: string,
  groupId: string,
  input: { fromUserId: string; toUserId: string; amountMinor: number; note: string },
) {
  const membership = await groupsRepo.getMembership(groupId, actorId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }

  if (!(await groupsRepo.memberExists(groupId, input.fromUserId))) {
    throw new AppError('VALIDATION_ERROR', 'fromUserId must be a group member', 400);
  }
  if (!(await groupsRepo.memberExists(groupId, input.toUserId))) {
    throw new AppError('VALIDATION_ERROR', 'toUserId must be a group member', 400);
  }

  return withTransaction(async (client) => {
    const row = await settlementsRepo.insertSettlement(client, {
      groupId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      amountMinor: input.amountMinor,
      note: input.note,
    });
    await groupsRepo.insertActivity(client, {
      groupId,
      actorId,
      type: 'settlement.created',
      payload: {
        settlementId: row.id,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        amountMinor: input.amountMinor,
      },
    });
    return mapSettlement(row);
  });
}

export async function listSettlements(
  actorId: string,
  groupId: string,
  limit = 50,
  offset = 0,
) {
  const membership = await groupsRepo.getMembership(groupId, actorId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }
  const rows = await settlementsRepo.listSettlements(groupId, limit, offset);
  return { items: rows.map(mapSettlement), limit, offset };
}
