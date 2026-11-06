import { withTransaction } from '../../db/transaction';
import { AppError } from '../../middleware/error-handler';
import * as groupsRepo from '../groups/groups.repository';
import type { ExpenseBody } from './expenses.schemas';
import * as expensesRepo from './expenses.repository';
import { computeSplits, type ComputedSplit } from './split.service';

function mapExpense(
  row: expensesRepo.ExpenseRow,
  splits: { user_id: string; share_minor: string }[],
) {
  return {
    id: row.id,
    groupId: row.group_id,
    description: row.description,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    paidBy: row.paid_by,
    splitType: row.split_type,
    splits: splits.map((s) => ({
      userId: s.user_id,
      shareMinor: Number(s.share_minor),
    })),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
  };
}

async function assertMember(groupId: string, userId: string) {
  const membership = await groupsRepo.getMembership(groupId, userId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }
  return membership;
}

async function assertParticipantsAreMembers(
  groupId: string,
  paidBy: string,
  splitUserIds: string[],
) {
  const members = await groupsRepo.listMembers(groupId);
  const memberIds = new Set(members.map((m) => m.user_id));
  if (!memberIds.has(paidBy)) {
    throw new AppError('VALIDATION_ERROR', 'paidBy must be a group member', 400);
  }
  for (const id of splitUserIds) {
    if (!memberIds.has(id)) {
      throw new AppError('VALIDATION_ERROR', 'All split users must be group members', 400);
    }
  }
}

function resolveComputed(body: ExpenseBody): ComputedSplit[] {
  return computeSplits({
    amountMinor: body.amountMinor,
    splitType: body.splitType,
    payerId: body.paidBy,
    participants: body.participants,
    splits: body.splits,
  });
}

export async function createExpense(actorId: string, groupId: string, body: ExpenseBody) {
  await assertMember(groupId, actorId);
  const group = await groupsRepo.findGroupById(groupId);
  if (!group) {
    throw new AppError('NOT_FOUND', 'Group not found', 404);
  }

  const splits = resolveComputed(body);
  await assertParticipantsAreMembers(
    groupId,
    body.paidBy,
    splits.map((s) => s.userId),
  );

  return withTransaction(async (client) => {
    const row = await expensesRepo.insertExpense(client, {
      groupId,
      paidBy: body.paidBy,
      amountMinor: body.amountMinor,
      currency: group.currency,
      description: body.description,
      splitType: body.splitType,
    });
    await expensesRepo.replaceSplits(client, row.id, splits);
    await groupsRepo.insertActivity(client, {
      groupId,
      actorId,
      type: 'expense.created',
      payload: {
        expenseId: row.id,
        description: row.description,
        amountMinor: body.amountMinor,
      },
    });

    return mapExpense(
      row,
      splits.map((s) => ({ user_id: s.userId, share_minor: String(s.shareMinor) })),
    );
  });
}

export async function listExpenses(actorId: string, groupId: string, includeDeleted: boolean) {
  await assertMember(groupId, actorId);
  const rows = await expensesRepo.listExpenses(groupId, includeDeleted);
  const splitRows = await expensesRepo.listSplitsForExpenses(rows.map((r) => r.id));
  const byExpense = new Map<string, { user_id: string; share_minor: string }[]>();
  for (const s of splitRows) {
    const list = byExpense.get(s.expense_id) ?? [];
    list.push(s);
    byExpense.set(s.expense_id, list);
  }
  return {
    items: rows.map((r) => mapExpense(r, byExpense.get(r.id) ?? [])),
  };
}

export async function getExpense(actorId: string, groupId: string, expenseId: string) {
  await assertMember(groupId, actorId);
  const row = await expensesRepo.findExpense(groupId, expenseId);
  if (!row) {
    throw new AppError('NOT_FOUND', 'Expense not found', 404);
  }
  const splits = await expensesRepo.listSplits(row.id);
  return mapExpense(row, splits);
}

export async function updateExpense(
  actorId: string,
  groupId: string,
  expenseId: string,
  body: ExpenseBody,
) {
  await assertMember(groupId, actorId);
  const existing = await expensesRepo.findExpense(groupId, expenseId);
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Expense not found', 404);
  }
  if (existing.deleted_at) {
    throw new AppError('CONFLICT', 'Cannot edit a deleted expense', 409);
  }

  const splits = resolveComputed(body);
  await assertParticipantsAreMembers(
    groupId,
    body.paidBy,
    splits.map((s) => s.userId),
  );

  return withTransaction(async (client) => {
    const row = await expensesRepo.updateExpense(client, expenseId, {
      paidBy: body.paidBy,
      amountMinor: body.amountMinor,
      description: body.description,
      splitType: body.splitType,
    });
    if (!row) {
      throw new AppError('CONFLICT', 'Cannot edit a deleted expense', 409);
    }
    await expensesRepo.replaceSplits(client, expenseId, splits);
    await groupsRepo.insertActivity(client, {
      groupId,
      actorId,
      type: 'expense.updated',
      payload: { expenseId },
    });
    return mapExpense(
      row,
      splits.map((s) => ({ user_id: s.userId, share_minor: String(s.shareMinor) })),
    );
  });
}

export async function softDeleteExpense(actorId: string, groupId: string, expenseId: string) {
  await assertMember(groupId, actorId);
  const existing = await expensesRepo.findExpense(groupId, expenseId);
  if (!existing || existing.deleted_at) {
    throw new AppError('NOT_FOUND', 'Expense not found', 404);
  }

  await withTransaction(async (client) => {
    const ok = await expensesRepo.softDeleteExpense(client, expenseId);
    if (!ok) {
      throw new AppError('NOT_FOUND', 'Expense not found', 404);
    }
    await groupsRepo.insertActivity(client, {
      groupId,
      actorId,
      type: 'expense.deleted',
      payload: { expenseId },
    });
  });
}
