import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { registerUser, resetDb } from './helpers';

describe('balances & settlements', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seed() {
    const { res: owner } = await registerUser(app, { email: 'a@example.com', name: 'A' });
    const { res: friend } = await registerUser(app, { email: 'b@example.com', name: 'B' });
    const group = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ name: 'Trip' });
    await request(app)
      .post(`/api/v1/groups/${group.body.id}/members`)
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ email: 'b@example.com' });

    // A paid 10000, equal split → A net +5000, B net -5000
    await request(app)
      .post(`/api/v1/groups/${group.body.id}/expenses`)
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({
        description: 'Cab',
        amountMinor: 10000,
        paidBy: owner.body.user.id,
        splitType: 'equal',
        participants: [owner.body.user.id, friend.body.user.id],
      });

    return {
      ownerToken: owner.body.accessToken as string,
      ownerId: owner.body.user.id as string,
      friendId: friend.body.user.id as string,
      friendToken: friend.body.accessToken as string,
      groupId: group.body.id as string,
    };
  }

  it('returns nets and simplified payments', async () => {
    const ctx = await seed();
    const res = await request(app)
      .get(`/api/v1/groups/${ctx.groupId}/balances`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);

    expect(res.status).toBe(200);
    const byId = Object.fromEntries(
      res.body.members.map((m: { userId: string; netMinor: number }) => [m.userId, m.netMinor]),
    );
    expect(byId[ctx.ownerId]).toBe(5000);
    expect(byId[ctx.friendId]).toBe(-5000);
    expect(res.body.simplified).toEqual([
      { fromUserId: ctx.friendId, toUserId: ctx.ownerId, amountMinor: 5000 },
    ]);
  });

  it('settlement updates nets to zero', async () => {
    const ctx = await seed();
    const settle = await request(app)
      .post(`/api/v1/groups/${ctx.groupId}/settlements`)
      .set('Authorization', `Bearer ${ctx.friendToken}`)
      .send({
        fromUserId: ctx.friendId,
        toUserId: ctx.ownerId,
        amountMinor: 5000,
        note: 'UPI',
      });
    expect(settle.status).toBe(201);

    const balances = await request(app)
      .get(`/api/v1/groups/${ctx.groupId}/balances`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    for (const m of balances.body.members) {
      expect(m.netMinor).toBe(0);
    }
    expect(balances.body.simplified).toEqual([]);
  });

  it('soft-deleted expenses are excluded from balances', async () => {
    const ctx = await seed();
    const listed = await request(app)
      .get(`/api/v1/groups/${ctx.groupId}/expenses`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    const expenseId = listed.body.items[0].id as string;

    await request(app)
      .delete(`/api/v1/groups/${ctx.groupId}/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);

    const balances = await request(app)
      .get(`/api/v1/groups/${ctx.groupId}/balances`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    for (const m of balances.body.members) {
      expect(m.netMinor).toBe(0);
    }
  });

  it('dashboard aggregates you owe / are owed', async () => {
    const ctx = await seed();
    const dash = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${ctx.friendToken}`);
    expect(dash.status).toBe(200);
    expect(dash.body.youOweMinor).toBe(5000);
    expect(dash.body.youAreOwedMinor).toBe(0);
    expect(dash.body.overallMinor).toBe(-5000);
  });

  it('lists activity and friends', async () => {
    const ctx = await seed();
    const activity = await request(app)
      .get('/api/v1/activity')
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    expect(activity.status).toBe(200);
    expect(activity.body.items.length).toBeGreaterThan(0);

    const friends = await request(app)
      .get('/api/v1/friends')
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    expect(friends.status).toBe(200);
    expect(friends.body.items).toEqual([
      expect.objectContaining({ userId: ctx.friendId, sharedGroupCount: 1 }),
    ]);
  });
});
