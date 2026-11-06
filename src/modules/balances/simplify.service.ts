export type MemberNet = {
  userId: string;
  netMinor: number;
};

export type SuggestedPayment = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
};

/**
 * Greedy debt simplification: largest creditor vs largest debtor until nets are zero.
 */
export function simplifyDebts(members: MemberNet[]): SuggestedPayment[] {
  const creditors = members
    .filter((m) => m.netMinor > 0)
    .map((m) => ({ userId: m.userId, amount: m.netMinor }))
    .sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId));

  const debtors = members
    .filter((m) => m.netMinor < 0)
    .map((m) => ({ userId: m.userId, amount: -m.netMinor }))
    .sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId));

  const payments: SuggestedPayment[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0) {
      payments.push({
        fromUserId: debtors[i].userId,
        toUserId: creditors[j].userId,
        amountMinor: pay,
      });
      debtors[i].amount -= pay;
      creditors[j].amount -= pay;
    }
    if (debtors[i].amount === 0) i += 1;
    if (creditors[j].amount === 0) j += 1;
  }

  return payments;
}
