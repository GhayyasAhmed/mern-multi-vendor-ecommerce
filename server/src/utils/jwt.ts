import "dotenv/config";
import { Response } from "express";
import { IUser } from "../models/user.model.js";
import { IShop } from "../models/shop.model.js";
import { redis } from "../config/redis.js";

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: "strict" | "lax" | "none" | undefined;
    secure?: boolean;
}

// parse env variables to integrate with fallback values
const accessTokenExpiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "2", 10) * 60 * 60 * 1000;
const refreshTokenExpiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "24", 10) * 60 * 60 * 1000;

// options for cookies
export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpiresIn),
    maxAge: accessTokenExpiresIn,
    httpOnly: true,
    sameSite: "none",
    secure: true
};

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpiresIn),
    maxAge: refreshTokenExpiresIn,
    httpOnly: true,
    sameSite: "none",
    secure: true
};

export const sendToken = async (user: IUser | IShop, statusCode: number, res: Response, message: string) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // Upload session to Redis
    await redis.set(user._id.toString(), JSON.stringify(user), "EX", refreshTokenExpiresIn / 1000);

    res.status(statusCode)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json({
            success: true,
            message,
            user
        });
};