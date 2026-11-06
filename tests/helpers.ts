import request from 'supertest';
import type { Express } from 'express';
import { pool } from '../src/db/pool';

export async function resetDb() {
  await pool.query(`
    TRUNCATE refresh_tokens, activity_log, settlements, expense_splits, expenses,
             group_members, groups, users RESTART IDENTITY CASCADE
  `);
}

export async function registerUser(
  app: Express,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  const body = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: overrides.password ?? 'password123',
  };
  const res = await request(app).post('/api/v1/auth/register').send(body);
  return { res, body };
}
