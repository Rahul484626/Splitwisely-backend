import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';

describe('GET /health', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('returns status and db', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('db');
    expect(['up', 'down']).toContain(res.body.db);

    if (res.body.db === 'up') {
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    }
  });
});
