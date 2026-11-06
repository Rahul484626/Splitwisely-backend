import {
  computeEqualSplits,
  computeExactSplits,
  computeWeightedSplits,
} from '../src/modules/expenses/split.service';

describe('split.service', () => {
  const payer = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const u2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const u3 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  it('splits 10000 equally across 3 with remainder to payer', () => {
    const splits = computeEqualSplits(10000, [u2, payer, u3], payer);
    const sum = splits.reduce((s, x) => s + x.shareMinor, 0);
    expect(sum).toBe(10000);

    const byId = Object.fromEntries(splits.map((s) => [s.userId, s.shareMinor]));
    // 10000 / 3 = 3333 each, remainder 1 → payer gets +1
    expect(byId[payer]).toBe(3334);
    expect(byId[u2]).toBe(3333);
    expect(byId[u3]).toBe(3333);
  });

  it('rejects exact splits that do not sum', () => {
    expect(() =>
      computeExactSplits(1000, [
        { userId: payer, shareMinor: 400 },
        { userId: u2, shareMinor: 400 },
      ]),
    ).toThrow(/sum/);
  });

  it('accepts exact splits that sum', () => {
    const splits = computeExactSplits(1000, [
      { userId: payer, shareMinor: 600 },
      { userId: u2, shareMinor: 400 },
    ]);
    expect(splits).toEqual([
      { userId: payer, shareMinor: 600 },
      { userId: u2, shareMinor: 400 },
    ]);
  });

  it('computes percentage splits with remainder to payer', () => {
    // 10001 * 50% / 50% → floors 5000/5000, remainder 1 → payer
    const splits = computeWeightedSplits(
      10001,
      [
        { userId: payer, weight: 50 },
        { userId: u2, weight: 50 },
      ],
      payer,
    );
    const sum = splits.reduce((s, x) => s + x.shareMinor, 0);
    expect(sum).toBe(10001);
    const byId = Object.fromEntries(splits.map((s) => [s.userId, s.shareMinor]));
    expect(byId[payer]).toBe(5001);
    expect(byId[u2]).toBe(5000);
  });

  it('computes share weights', () => {
    const splits = computeWeightedSplits(
      1000,
      [
        { userId: payer, weight: 1 },
        { userId: u2, weight: 1 },
        { userId: u3, weight: 2 },
      ],
      payer,
    );
    const sum = splits.reduce((s, x) => s + x.shareMinor, 0);
    expect(sum).toBe(1000);
    const byId = Object.fromEntries(splits.map((s) => [s.userId, s.shareMinor]));
    // 1000 * 1/4 = 250, 250, 500
    expect(byId[payer]).toBe(250);
    expect(byId[u2]).toBe(250);
    expect(byId[u3]).toBe(500);
  });
});
