import { redis } from "../config/redis.js";

const PENDING_AVATAR_UPLOADS_KEY = "pending_avatar_uploads";

export const PENDING_SIGNUP_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export const trackPendingUpload = async (publicId: string, expiresAtMs: number): Promise<void> => {
  if (!publicId) return;
  await redis.zadd(PENDING_AVATAR_UPLOADS_KEY, expiresAtMs, publicId);
};

export const clearPendingUpload = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  await redis.zrem(PENDING_AVATAR_UPLOADS_KEY, publicId);
};

export const getExpiredPendingUploads = async (beforeMs: number): Promise<string[]> => {
  return redis.zrangebyscore(PENDING_AVATAR_UPLOADS_KEY, 0, beforeMs);
};

export const removeExpiredPendingUploads = async (publicIds: string[]): Promise<void> => {
  if (publicIds.length === 0) return;
  await redis.zrem(PENDING_AVATAR_UPLOADS_KEY, ...publicIds);
};