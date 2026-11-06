import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { param } from '../../utils/params';
import { createSettlementSchema } from './settlements.schemas';
import * as settlementsService from './settlements.service';

export const settlementsRouter = Router();

settlementsRouter.post(
  '/groups/:groupId/settlements',
  requireAuth,
  validateBody(createSettlementSchema),
  async (req, res, next) => {
    try {
      const settlement = await settlementsService.createSettlement(
        req.userId!,
        param(req.params.groupId, 'groupId'),
        req.body,
      );
      res.status(201).json(settlement);
    } catch (err) {
      next(err);
    }
  },
);

settlementsRouter.get('/groups/:groupId/settlements', requireAuth, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);
    const result = await settlementsService.listSettlements(
      req.userId!,
      param(req.params.groupId, 'groupId'),
      Number.isFinite(limit) ? limit : 50,
      Number.isFinite(offset) ? offset : 0,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});
