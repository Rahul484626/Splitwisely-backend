import { AppError } from '../../middleware/error-handler';
import * as groupsRepo from '../groups/groups.repository';
import * as balancesRepo from './balances.repository';
import { simplifyDebts } from './simplify.service';

export async function getGroupBalances(actorId: string, groupId: string) {
  const membership = await groupsRepo.getMembership(groupId, actorId);
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a group member', 403);
  }

  const rows = await balancesRepo.netBalancesForGroup(groupId);
  const members = rows.map((r) => ({
    userId: r.user_id,
    netMinor: Number(r.net_minor),
  }));

  return {
    members,
    simplified: simplifyDebts(members),
  };
}

export async function netsByGroupForUser(userId: string): Promise<Map<string, number>> {
  const rows = await balancesRepo.netBalancesForUserAcrossGroups(userId);
  return new Map(rows.map((r) => [r.group_id, Number(r.net_minor)]));
}

export async function dashboardTotals(userId: string) {
  const nets = await netsByGroupForUser(userId);
  let youOweMinor = 0;
  let youAreOwedMinor = 0;
  for (const net of nets.values()) {
    if (net < 0) youOweMinor += -net;
    if (net > 0) youAreOwedMinor += net;
  }
  return {
    youOweMinor,
    youAreOwedMinor,
    overallMinor: youAreOwedMinor - youOweMinor,
  };
}
