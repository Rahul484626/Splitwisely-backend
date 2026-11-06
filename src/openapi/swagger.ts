import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json';

export function mountSwagger(app: Express): void {
  app.get('/api/v1/openapi.json', (_req, res) => {
    res.json(openapi);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));
}
