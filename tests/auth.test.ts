import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { registerUser, resetDb } from './helpers';

describe('auth', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('registers and returns tokens', async () => {
    const { res } = await registerUser(app, { email: 'a@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('a@example.com');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('rejects duplicate email', async () => {
    await registerUser(app, { email: 'dup@example.com' });
    const { res } = await registerUser(app, { email: 'dup@example.com' });
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    await registerUser(app, { email: 'login@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('rejects bad password', async () => {
    await registerUser(app, { email: 'bad@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bad@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('refreshes tokens and detects reuse', async () => {
    const { res: reg } = await registerUser(app, { email: 'refresh@example.com' });
    const oldRefresh = reg.body.refreshToken as string;

    const first = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefresh });
    expect(first.status).toBe(200);
    expect(first.body.refreshToken).not.toBe(oldRefresh);

    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefresh });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('UNAUTHORIZED');
  });

  it('logs out and invalidates refresh', async () => {
    const { res: reg } = await registerUser(app, { email: 'out@example.com' });
    const refreshToken = reg.body.refreshToken as string;

    const logout = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(logout.status).toBe(204);

    const again = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(again.status).toBe(401);
  });

  it('returns current user via /me', async () => {
    const { res: reg } = await registerUser(app, { email: 'me@example.com', name: 'Me' });
    const me = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('me@example.com');
    expect(me.body.name).toBe('Me');
  });
});
