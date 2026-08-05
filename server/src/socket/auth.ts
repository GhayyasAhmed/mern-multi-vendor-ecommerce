import type { ExtendedError } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import type { IUser } from "../models/user.model.js";
import type { IShop } from "../models/shop.model.js";
import type { AppSocket } from "./types.js";

/**
 * Minimal cookie-header parser for the socket handshake. Avoids pulling in
 * an extra dependency for the small subset cookie-parser already covers
 * on the REST side (these cookies are never signed, same as the REST flow).
 */
function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const pair of cookieHeader.split(";")) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }

  return cookies;
}

/**
 * Authenticates a socket connection using the exact same cookies/JWTs/Redis
 * sessions as isAuthenticated / isSeller (middlewares/auth.ts). No socket
 * token, no client-supplied id — identity comes entirely from the existing
 * auth system.
 */
export const socketAuthMiddleware = async (
  socket: AppSocket,
  next: (err?: ExtendedError) => void
): Promise<void> => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const accessToken = cookies.accessToken;
    const sellerToken = cookies.seller_token;

    if (accessToken) {
      const decoded = jwt.verify(accessToken, env.accessTokenSecret) as JwtPayload;
      const sessionRaw = await redis.get(decoded.id);

      if (!sessionRaw) {
        return next(new Error("Session expired. Please login again"));
      }

      socket.data.role = "user";
      socket.data.user = JSON.parse(sessionRaw) as IUser;
      return next();
    }

    if (sellerToken) {
      const decoded = jwt.verify(sellerToken, env.jwtSecretKey) as JwtPayload;
      const sessionRaw = await redis.get(`seller_${decoded.id}`);

      if (!sessionRaw) {
        return next(new Error("Shop session expired. Please login again"));
      }

      socket.data.role = "seller";
      socket.data.seller = JSON.parse(sessionRaw) as IShop;
      return next();
    }

    return next(new Error("Please login to access this resource"));
  } catch {
    return next(new Error("Invalid or expired authentication"));
  }
};