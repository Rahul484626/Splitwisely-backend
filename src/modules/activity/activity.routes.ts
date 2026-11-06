import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { param } from '../../utils/params';
import * as activityService from './activity.service';

export const activityRouter = Router();

activityRouter.get('/activity', requireAuth, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);
    const result = await activityService.listMyActivity(
      req.userId!,
      Number.isFinite(limit) ? limit : 50,
      Number.isFinite(offset) ? offset : 0,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

activityRouter.get('/groups/:groupId/activity', requireAuth, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);
    const result = await activityService.listGroupActivity(
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

activityRouter.get('/friends', requireAuth, async (req, res, next) => {
  try {
    const result = await activityService.listFriends(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
