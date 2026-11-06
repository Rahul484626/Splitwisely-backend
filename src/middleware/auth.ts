import type { NextFunction, Request, Response } from 'express';
import { AppError } from './error-handler';
import { verifyAccessToken } from '../utils/tokens';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('UNAUTHORIZED', 'Missing or invalid access token', 401));
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError('UNAUTHORIZED', 'Missing or invalid access token', 401));
  }
}
