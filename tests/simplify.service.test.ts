import { simplifyDebts } from '../src/modules/balances/simplify.service';

describe('simplifyDebts', () => {
  it('reduces A→B and B→C into A→C when nets allow', () => {
    // A paid so B and C owe A; classic nets: A +100, B -40, C -60
    const payments = simplifyDebts([
      { userId: 'A', netMinor: 100 },
      { userId: 'B', netMinor: -40 },
      { userId: 'C', netMinor: -60 },
    ]);
    expect(payments).toEqual([
      { fromUserId: 'C', toUserId: 'A', amountMinor: 60 },
      { fromUserId: 'B', toUserId: 'A', amountMinor: 40 },
    ]);
  });

  it('returns empty when everyone is settled', () => {
    expect(
      simplifyDebts([
        { userId: 'A', netMinor: 0 },
        { userId: 'B', netMinor: 0 },
      ]),
    ).toEqual([]);
  });

  it('handles three-way with transfer of remainder', () => {
    const payments = simplifyDebts([
      { userId: 'A', netMinor: 50 },
      { userId: 'B', netMinor: 30 },
      { userId: 'C', netMinor: -80 },
    ]);
    const sumOut = payments.reduce((s, p) => s + p.amountMinor, 0);
    expect(sumOut).toBe(80);
    expect(payments.every((p) => p.fromUserId === 'C')).toBe(true);
  });
});
