import { Router } from 'express';
import { authRateLimit } from '../../middleware/rate-limit';
import { validateBody } from '../../middleware/validate';
import * as authService from './auth.service';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas';

export const authRouter = Router();
authRouter.use('/auth', authRateLimit);

authRouter.post('/auth/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/refresh', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/logout', validateBody(refreshSchema), async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
