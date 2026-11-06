import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { param } from '../../utils/params';
import * as balancesService from './balances.service';

export const balancesRouter = Router();

balancesRouter.get('/groups/:groupId/balances', requireAuth, async (req, res, next) => {
  try {
    const result = await balancesService.getGroupBalances(
      req.userId!,
      param(req.params.groupId, 'groupId'),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

balancesRouter.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const totals = await balancesService.dashboardTotals(req.userId!);
    res.json(totals);
  } catch (err) {
    next(err);
  }
});
