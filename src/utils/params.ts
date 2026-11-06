import { AppError } from '../middleware/error-handler';

export function param(value: string | string[] | undefined, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError('VALIDATION_ERROR', `Invalid path parameter: ${name}`, 400);
  }
  return value;
}
