import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/error-handler';
import { validateBody } from '../../middleware/validate';
import { toPublicUser } from './user.mapper';
import { patchMeSchema } from './users.schemas';
import * as usersRepo from './users.repository';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await usersRepo.findUserById(req.userId!);
    if (!user || user.deactivated_at) {
      throw new AppError('UNAUTHORIZED', 'User not found', 401);
    }
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
});

usersRouter.patch('/me', requireAuth, validateBody(patchMeSchema), async (req, res, next) => {
  try {
    const updated = await usersRepo.updateUser(req.userId!, {
      name: req.body.name,
      defaultCurrency: req.body.defaultCurrency?.toUpperCase(),
    });
    if (!updated) {
      throw new AppError('UNAUTHORIZED', 'User not found', 401);
    }
    res.json(toPublicUser(updated));
  } catch (err) {
    next(err);
  }
});
