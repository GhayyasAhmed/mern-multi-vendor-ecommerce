import { Response } from "express";
import jwt from "jsonwebtoken";
import { IShop } from "../models/shop.model.js";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";

// Seller session TTL. Must match both the JWT expiry and the cookie
// `expires` below, and the Redis session TTL — previously the JWT itself
// expired after 5 minutes (via IShop.getJwtToken, meant for short-lived
// activation links) while the cookie/Redis session lived 90 days, silently
// logging sellers out a few minutes after login. Signing directly here
// with a matching 90-day expiry fixes that.
const SELLER_SESSION_SECONDS = 90 * 24 * 60 * 60;

const sendShopToken = async (
  user: IShop,
  statusCode: number,
  res: Response,
  message: string
): Promise<void> => {
  const token = jwt.sign({ id: user._id, role: user.role }, env.jwtSecretKey, {
    expiresIn: `${SELLER_SESSION_SECONDS}s`,
  });

  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    expires: new Date(Date.now() + SELLER_SESSION_SECONDS * 1000),
    httpOnly: true,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    secure: isProduction,
  };

  // Sanitize document explicitly before Redis cache and HTTP response payload
  const sanitizedUser = typeof user.toJSON === "function" ? user.toJSON() : user;

  // Persist the seller session in Redis so isSeller middleware can validate it
  await redis.set(
    `seller_${user._id.toString()}`,
    JSON.stringify(sanitizedUser),
    "EX",
    SELLER_SESSION_SECONDS
  );

  // "seller" (not "token") to avoid exposing the httpOnly cookie value in
  // the JSON body, and to align with getSellerDetails' response shape.
  res.status(statusCode).cookie("seller_token", token, options).json({
    success: true,
    message,
    seller: sanitizedUser,
  });
};

export default sendShopToken;