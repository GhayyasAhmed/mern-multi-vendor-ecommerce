import { Response } from "express";
import { IShop } from "../models/shop.model.js";

const sendShopToken = (
  user: IShop,
  statusCode: number,
  res: Response
): void => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
  };

  res.status(statusCode).cookie("seller_token", token, options).json({
    success: true,
    user,
    token,
  });
};

export default sendShopToken;