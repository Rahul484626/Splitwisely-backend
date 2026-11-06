import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { registerUser, resetDb } from './helpers';

describe('groups', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates and lists groups', async () => {
    const { res: reg } = await registerUser(app, { email: 'owner@example.com' });
    const token = reg.body.accessToken as string;

    const created = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Goa Trip', currency: 'INR' });

    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Goa Trip');
    expect(created.body.memberCount).toBe(1);

    const listed = await request(app).get('/api/v1/groups').set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('adds member by email', async () => {
    const { res: owner } = await registerUser(app, { email: 'admin@example.com' });
    await registerUser(app, { email: 'friend@example.com', name: 'Friend' });

    const group = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ name: 'Flat' });

    const member = await request(app)
      .post(`/api/v1/groups/${group.body.id}/members`)
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ email: 'friend@example.com' });

    expect(member.status).toBe(201);
    expect(member.body.email).toBe('friend@example.com');

    const detail = await request(app)
      .get(`/api/v1/groups/${group.body.id}`)
      .set('Authorization', `Bearer ${owner.body.accessToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.members).toHaveLength(2);
  });

  it('forbids non-members from viewing a group', async () => {
    const { res: owner } = await registerUser(app, { email: 'o@example.com' });
    const { res: stranger } = await registerUser(app, { email: 's@example.com' });

    const group = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ name: 'Secret' });

    const detail = await request(app)
      .get(`/api/v1/groups/${group.body.id}`)
      .set('Authorization', `Bearer ${stranger.body.accessToken}`);

    expect(detail.status).toBe(403);
  });
});
