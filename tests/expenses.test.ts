import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { registerUser, resetDb } from './helpers';

describe('expenses', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedGroupWithTwoMembers() {
    const { res: owner } = await registerUser(app, {
      email: 'owner@example.com',
      name: 'Owner',
    });
    const { res: friend } = await registerUser(app, {
      email: 'friend@example.com',
      name: 'Friend',
    });

    const group = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ name: 'Trip' });

    await request(app)
      .post(`/api/v1/groups/${group.body.id}/members`)
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ email: 'friend@example.com' });

    return {
      ownerToken: owner.body.accessToken as string,
      ownerId: owner.body.user.id as string,
      friendId: friend.body.user.id as string,
      groupId: group.body.id as string,
    };
  }

  it('creates equal split expense that sums to amount', async () => {
    const ctx = await seedGroupWithTwoMembers();
    const res = await request(app)
      .post(`/api/v1/groups/${ctx.groupId}/expenses`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`)
      .send({
        description: 'Dinner',
        amountMinor: 10001,
        paidBy: ctx.ownerId,
        splitType: 'equal',
        participants: [ctx.ownerId, ctx.friendId],
      });

    expect(res.status).toBe(201);
    const sum = res.body.splits.reduce(
      (s: number, x: { shareMinor: number }) => s + x.shareMinor,
      0,
    );
    expect(sum).toBe(10001);
    expect(res.body.splits).toHaveLength(2);
  });

  it('creates exact split and lists it', async () => {
    const ctx = await seedGroupWithTwoMembers();
    const created = await request(app)
      .post(`/api/v1/groups/${ctx.groupId}/expenses`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`)
      .send({
        description: 'Taxi',
        amountMinor: 50000,
        paidBy: ctx.ownerId,
        splitType: 'exact',
        splits: [
          { userId: ctx.ownerId, shareMinor: 20000 },
          { userId: ctx.friendId, shareMinor: 30000 },
        ],
      });
    expect(created.status).toBe(201);

    const listed = await request(app)
      .get(`/api/v1/groups/${ctx.groupId}/expenses`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].description).toBe('Taxi');
  });

  it('soft-deletes expense and hides from default list', async () => {
    const ctx = await seedGroupWithTwoMembers();
    const created = await request(app)
      .post(`/api/v1/groups/${ctx.groupId}/expenses`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`)
      .send({
        description: 'Snacks',
        amountMinor: 2000,
        paidBy: ctx.ownerId,
        splitType: 'equal',
        participants: [ctx.ownerId, ctx.friendId],
      });

    const del = await request(app)
      .delete(`/api/v1/groups/${ctx.groupId}/expenses/${created.body.id}`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    expect(del.status).toBe(204);

    const listed = await request(app)
      .get(`/api/v1/groups/${ctx.groupId}/expenses`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    expect(listed.body.items).toHaveLength(0);

    const withDeleted = await request(app)
      .get(`/api/v1/groups/${ctx.groupId}/expenses?includeDeleted=true`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`);
    expect(withDeleted.body.items).toHaveLength(1);
    expect(withDeleted.body.items[0].deletedAt).toBeTruthy();
  });

  it('rejects exact splits that do not sum', async () => {
    const ctx = await seedGroupWithTwoMembers();
    const res = await request(app)
      .post(`/api/v1/groups/${ctx.groupId}/expenses`)
      .set('Authorization', `Bearer ${ctx.ownerToken}`)
      .send({
        description: 'Bad',
        amountMinor: 1000,
        paidBy: ctx.ownerId,
        splitType: 'exact',
        splits: [
          { userId: ctx.ownerId, shareMinor: 400 },
          { userId: ctx.friendId, shareMinor: 400 },
        ],
      });
    expect(res.status).toBe(400);
  });
});
