import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { activityRouter } from './modules/activity/activity.routes';
import { authRouter } from './modules/auth/auth.routes';
import { balancesRouter } from './modules/balances/balances.routes';
import { expensesRouter } from './modules/expenses/expenses.routes';
import { groupsRouter } from './modules/groups/groups.routes';
import { healthRouter } from './modules/health/health.routes';
import { settlementsRouter } from './modules/settlements/settlements.routes';
import { usersRouter } from './modules/users/users.routes';
import { mountSwagger } from './openapi/swagger';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Swagger UI needs inline scripts/styles in local/dev
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN.split(',').map((o) => o.trim()),
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  mountSwagger(app);

  app.use(healthRouter);
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', authRouter);
  app.use('/api/v1', usersRouter);
  app.use('/api/v1', groupsRouter);
  app.use('/api/v1', expensesRouter);
  app.use('/api/v1', balancesRouter);
  app.use('/api/v1', settlementsRouter);
  app.use('/api/v1', activityRouter);

  app.use(errorHandler);
  return app;
}
