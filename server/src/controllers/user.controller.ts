import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import User from "../models/user.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { sendToken } from "../utils/jwt.js";
import sendEmail from "../utils/sendEmail.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt.js";

export interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export interface IActivationToken {
    activationToken: string;
    expireMinutes: number;
}

export interface IActivationRequest {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    };
}

// 1. Helper Function: Create and Save Activation Token in Redis
export const createActivationToken = async (
    user: IActivationRequest
): Promise<IActivationToken> => {
    // Generate a cryptographically secure, unique token (used in URL)
    const activationToken = crypto.randomBytes(32).toString("hex");

    // Read expiration time from environment variable (default: 5 mins)
    const expireMinutes = parseInt(process.env.JWT_EXPIRES || "5", 10);

    // Store user registration data directly under the activation token key
    await redis.set(
        `activation:${activationToken}`,
        JSON.stringify(user),
        "EX",
        Math.max(expireMinutes, 1) * 60
    );

    return { activationToken, expireMinutes };
};

// 2. Create User & Send Link-Based Activation Mail
export const createUser = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, email, password, avatar } = req.body;

        const userEmail = await User.findOne({ email });
        if (userEmail) {
            return next(new ErrorHandler("User already exists", 400));
        }

        // Hash password before saving to Redis
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const myCloud = await cloudinary.uploader.upload(avatar, {
            folder: "avatars",
        });

        const user: IActivationRequest = {
            name,
            email,
            password: hashedPassword,
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            },
        };

        // Call the helper function
        const { activationToken, expireMinutes } = await createActivationToken(user);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const activationUrl = `${frontendUrl}/activation/${activationToken}`;

        // Kept: this try/catch performs a compensating action (rollback of the
        // Redis activation key) on failure, it is not just forwarding the error.
        try {
            await sendEmail({
                email: user.email,
                subject: "Activate your account",
                message: `Hello ${user.name},\n\nPlease click the link below to activate your account:\n\n${activationUrl}\n\nThis link will expire in ${expireMinutes} minutes.`,
            });

            res.status(201).json({
                success: true,
                message: `Please check your email (${user.email}) to activate your account!`,
            });
        } catch (error: any) {
            // Rollback Redis key if email fails to send
            await redis.del(`activation:${activationToken}`);
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// 3. Activate User via Link
export const activateUser = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { activation_token } = req.body;

        if (!activation_token) {
            return next(new ErrorHandler("Activation token is missing", 400));
        }

        // Check Redis for token existence
        const redisData = await redis.get(`activation:${activation_token}`);

        if (!redisData) {
            return next(
                new ErrorHandler(
                    "Activation link is invalid or has expired. Please sign up again.",
                    400
                )
            );
        }

        const user: IActivationRequest = JSON.parse(redisData);

        // Check if user was already created
        const existingUser = await User.findOne({ email: user.email });
        if (existingUser) {
            await redis.del(`activation:${activation_token}`);
            return next(new ErrorHandler("User already exists", 400));
        }

        // Create user in database
        const newUser = await User.create({
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            password: user.password,
        });

        // Clean up Redis key so it cannot be reused
        await redis.del(`activation:${activation_token}`);

        // Log user in & set cookie/response token
        sendToken(newUser, 201, res, "Account activated successfully!");
    }
);

// 3. Login User
export const loginUser = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ErrorHandler("Please provide all fields!", 400));
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorHandler("User doesn't exist!", 400));
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return next(
                new ErrorHandler("Please provide the correct information", 400)
            );
        }

        sendToken(user, 201, res, "Login successful");
    }
);

// 4. Get Authenticated User Details
export const getUserDetails = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await User.findById((req as any).user._id);

        if (!user) {
            return next(new ErrorHandler("User doesn't exist", 400));
        }

        res.status(200).json({
            success: true,
            user,
        });
    }
);

// 5. Logout User
export const logoutUser = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?._id;

        res.cookie("accessToken", "", {
            expires: new Date(Date.now()),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.cookie("refreshToken", "", {
            expires: new Date(Date.now()),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        if (userId) {
            await redis.del(userId.toString());
        }

        res.status(201).json({
            success: true,
            message: "Log out successful!",
        });
    }
);


export const refreshAccessToken = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const refreshToken: string | undefined = req.cookies.refreshToken;
        if (!refreshToken) {
            return next(new ErrorHandler("No refresh token provided", 401));
        }

        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(refreshToken, env.refreshTokenSecret) as JwtPayload;
        } catch {
            return next(new ErrorHandler("Refresh token is invalid or expired", 401));
        }

        const sessionRaw = await redis.get(decoded.id as string);

        if (!sessionRaw) {
            return next(new ErrorHandler("Session expired. Please login again", 401));
        }

        const user = JSON.parse(sessionRaw);

        // Issue new access token
        const newAccessToken = jwt.sign(
            { id: decoded.id },
            env.accessTokenSecret,
            { expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE || "2"}h` as any }
        );

        // Rotate refresh token to limit reuse window
        const newRefreshToken = jwt.sign(
            { id: decoded.id },
            env.refreshTokenSecret,
            { expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE || "24"}h` as any }
        );

        // Extend Redis session TTL to match new refresh token lifetime
        const refreshTokenExpireInSeconds = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "24", 10) * 60 * 60;
        await redis.set(
            decoded.id as string,
            JSON.stringify(user),
            "EX",
            refreshTokenExpireInSeconds
        );

        res.cookie("accessToken", newAccessToken, accessTokenOptions);
        res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);

        res.status(200).json({
            success: true,
            message: "Access token refreshed",
        });
    }
);

// 6. Update User Information
export const updateUserInfo = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password, phoneNumber, name } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return next(
                new ErrorHandler("Please provide the correct information", 400)
            );
        }

        user.name = name;
        user.email = email;
        user.phoneNumber = phoneNumber;

        await user.save();

        res.status(201).json({
            success: true,
            user,
        });
    }
);

// 7. Update User Avatar
export const updateUserAvatar = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        let existsUser = await User.findById((req as any).user._id);

        if (!existsUser) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (req.body.avatar !== "") {
            if (existsUser.avatar?.public_id) {
                await cloudinary.uploader.destroy(existsUser.avatar.public_id);
            }

            const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
                folder: "avatars",
                width: 150,
            });

            existsUser.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        await existsUser.save();

        res.status(200).json({
            success: true,
            user: existsUser,
        });
    }
);

// 8. Update User Addresses
export const updateUserAddresses = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await User.findById((req as any).user._id);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const sameTypeAddress = user.addresses?.find(
            (address: any) => address.addressType === req.body.addressType
        );

        if (sameTypeAddress) {
            return next(
                new ErrorHandler(`${req.body.addressType} address already exists`, 400)
            );
        }

        const existsAddress = user.addresses?.find(
            (address: any) => address._id?.toString() === req.body._id
        );

        if (existsAddress) {
            Object.assign(existsAddress, req.body);
        } else {
            user.addresses?.push(req.body);
        }

        await user.save();

        res.status(200).json({
            success: true,
            user,
        });
    }
);

// 9. Delete User Address
export const deleteUserAddress = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user._id;
        const addressId = req.params.id;

        await User.updateOne(
            { _id: userId },
            { $pull: { addresses: { _id: addressId } } }
        );

        const user = await User.findById(userId);

        res.status(200).json({ success: true, user });
    }
);

// 10. Update User Password
export const updateUserPassword = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await User.findById((req as any).user._id).select("+password");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const isPasswordMatched = await user.comparePassword(
            req.body.oldPassword
        );

        if (!isPasswordMatched) {
            return next(new ErrorHandler("Old password is incorrect!", 400));
        }

        if (req.body.newPassword !== req.body.confirmPassword) {
            return next(
                new ErrorHandler("Passwords do not match!", 400)
            );
        }

        user.password = req.body.newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully!",
        });
    }
);

// 11. Get User Info by ID
export const getUserInfo = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await User.findById(req.params.id).select("name avatar");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        res.status(201).json({
            success: true,
            user,
        });
    }
);

// 12. Admin: Get All Users
export const getAllUsersAdmin = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(201).json({
            success: true,
            users,
        });
    }
);

// 13. Admin: Delete User
export const deleteUserAdmin = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await User.findById(req.params.id);

        if (!user) {
            return next(
                new ErrorHandler("User is not available with this id", 400)
            );
        }

        if (user.avatar?.public_id) {
            await cloudinary.uploader.destroy(user.avatar.public_id);
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(201).json({
            success: true,
            message: "User deleted successfully!",
        });
    }
);