import { Router } from 'express';
import { checkDb } from '../../db/pool';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const db = await checkDb();
  const status = db === 'up' ? 'ok' : 'degraded';
  res.status(db === 'up' ? 200 : 503).json({ status, db });
});
