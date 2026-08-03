import { Response } from "express";
import { IShop } from "../models/shop.model.js";
import { redis } from "../config/redis.js";

const sendShopToken = async (
  user: IShop,
  statusCode: number,
  res: Response,
  message: string
): Promise<void> => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
  };

  // Persist the seller session in Redis so isSeller middleware can validate it
  await redis.set(
    `seller_${user._id.toString()}`,
    JSON.stringify(user),
    "EX",
    90 * 24 * 60 * 60
  );

  res.status(statusCode).cookie("seller_token", token, options).json({
    success: true,
    message,
    user,
    token,
  });
};

export default sendShopToken;