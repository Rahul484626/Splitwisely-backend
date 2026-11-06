import { randomUUID } from 'crypto';
import { pool } from '../../db/pool';
import { withTransaction } from '../../db/transaction';
import { AppError } from '../../middleware/error-handler';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateRefreshToken, hashRefreshToken, signAccessToken } from '../../utils/tokens';
import { toPublicUser } from '../users/user.mapper';
import * as usersRepo from '../users/users.repository';
import * as refreshRepo from './refresh.repository';

export async function register(input: {
  name: string;
  email: string;
  password: string;
  defaultCurrency: string;
}) {
  const existing = await usersRepo.findUserByEmail(input.email);
  if (existing) {
    throw new AppError('CONFLICT', 'Email already registered', 409);
  }

  const passwordHash = await hashPassword(input.password);
  const familyId = randomUUID();

  return withTransaction(async (client) => {
    const row = await usersRepo.insertUser(client, {
      name: input.name,
      email: input.email,
      passwordHash,
      defaultCurrency: input.defaultCurrency.toUpperCase(),
    });
    const refresh = generateRefreshToken();
    await refreshRepo.insertRefreshToken(client, {
      userId: row.id,
      tokenHash: refresh.hash,
      familyId,
      expiresAt: refresh.expiresAt,
    });

    return {
      user: toPublicUser(row),
      accessToken: signAccessToken({ sub: row.id, email: row.email }),
      refreshToken: refresh.raw,
    };
  });
}

export async function login(input: { email: string; password: string }) {
  const row = await usersRepo.findUserByEmail(input.email);
  if (!row || row.deactivated_at) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
  }

  const ok = await verifyPassword(row.password_hash, input.password);
  if (!ok) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
  }

  const familyId = randomUUID();
  const refresh = generateRefreshToken();
  await refreshRepo.insertRefreshToken(pool, {
    userId: row.id,
    tokenHash: refresh.hash,
    familyId,
    expiresAt: refresh.expiresAt,
  });

  return {
    user: toPublicUser(row),
    accessToken: signAccessToken({ sub: row.id, email: row.email }),
    refreshToken: refresh.raw,
  };
}

export async function refresh(rawRefreshToken: string) {
  const hash = hashRefreshToken(rawRefreshToken);
  const existing = await refreshRepo.findRefreshByHash(hash);

  if (!existing) {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
  }

  if (existing.revoked_at) {
    await refreshRepo.revokeRefreshFamily(pool, existing.family_id);
    throw new AppError('UNAUTHORIZED', 'Refresh token reuse detected', 401);
  }

  if (existing.expires_at.getTime() < Date.now()) {
    throw new AppError('UNAUTHORIZED', 'Refresh token expired', 401);
  }

  const user = await usersRepo.findUserById(existing.user_id);
  if (!user || user.deactivated_at) {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
  }

  const next = generateRefreshToken();
  await withTransaction(async (client) => {
    await refreshRepo.revokeRefreshById(client, existing.id);
    await refreshRepo.insertRefreshToken(client, {
      userId: user.id,
      tokenHash: next.hash,
      familyId: existing.family_id,
      expiresAt: next.expiresAt,
    });
  });

  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email }),
    refreshToken: next.raw,
  };
}

export async function logout(rawRefreshToken: string) {
  const hash = hashRefreshToken(rawRefreshToken);
  const existing = await refreshRepo.findRefreshByHash(hash);
  if (existing && !existing.revoked_at) {
    await refreshRepo.revokeRefreshById(pool, existing.id);
  }
}
