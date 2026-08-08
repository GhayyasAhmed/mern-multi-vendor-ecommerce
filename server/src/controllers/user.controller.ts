import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Conversation from "../models/conversation.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { sendToken } from "../utils/jwt.js";
import sendEmail from "../utils/sendEmail.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { trackPendingUpload, clearPendingUpload, PENDING_SIGNUP_TTL_SECONDS } from "../utils/pendingUploads.js";

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
    const activationToken = crypto.randomBytes(32).toString("hex");
    const expireMinutes = parseInt(process.env.JWT_EXPIRES || "5", 10);

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

        if (!avatar) {
            return next(new ErrorHandler("Please upload a profile photo", 400));
        }

        const userEmail = await User.findOne({ email });
        if (userEmail) {
            return next(new ErrorHandler("User already exists", 400));
        }

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

        const { activationToken, expireMinutes } = await createActivationToken(user);

        await redis.set(
            `pending_signup:user:${email}`,
            JSON.stringify(user),
            "EX",
            PENDING_SIGNUP_TTL_SECONDS
        );
        await trackPendingUpload(user.avatar.public_id, Date.now() + PENDING_SIGNUP_TTL_SECONDS * 1000);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const activationUrl = `${frontendUrl}/activation/${activationToken}`;

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
            await redis.del(`activation:${activationToken}`);
            await redis.del(`pending_signup:user:${email}`);
            await clearPendingUpload(user.avatar.public_id);
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

        const existingUser = await User.findOne({ email: user.email });
        if (existingUser) {
            await redis.del(`activation:${activation_token}`);
            return next(new ErrorHandler("User already exists", 400));
        }

        const newUser = await User.create({
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            password: user.password,
        });

        await redis.del(`activation:${activation_token}`);
        await redis.del(`pending_signup:user:${user.email}`);
        await clearPendingUpload(user.avatar.public_id);
        sendToken(newUser, 201, res, "Account activated successfully!");
    }
);

// add new exported controller
export const resendActivation = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler("This account is already activated. Please login.", 400));
        }

        const pendingRaw = await redis.get(`pending_signup:user:${email}`);
        if (!pendingRaw) {
            return next(new ErrorHandler("No pending signup found for this email. Please sign up again.", 404));
        }

        const pendingUser: IActivationRequest = JSON.parse(pendingRaw);

        const { activationToken, expireMinutes } = await createActivationToken(pendingUser);

        await trackPendingUpload(pendingUser.avatar.public_id, Date.now() + PENDING_SIGNUP_TTL_SECONDS * 1000);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const activationUrl = `${frontendUrl}/activation/${activationToken}`;

        try {
            await sendEmail({
                email: pendingUser.email,
                subject: "Activate your account",
                message: `Hello ${pendingUser.name},\n\nPlease click the link below to activate your account:\n\n${activationUrl}\n\nThis link will expire in ${expireMinutes} minutes.`,
            });

            res.status(200).json({
                success: true,
                message: `A new activation link has been sent to ${pendingUser.email}`,
            });
        } catch (error: any) {
            await redis.del(`activation:${activationToken}`);
            return next(new ErrorHandler(error.message || "Failed to send activation email", 500));
        }
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
            return next(new ErrorHandler("Invalid email or password", 401));
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
        if (!req.user?._id) {
            return next(new ErrorHandler("User doesn't exist", 400));
        }

        const user = await User.findById(req.user._id);

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
        const userId = req.user?._id;

        res.cookie("accessToken", "", { ...accessTokenOptions, expires: new Date(0), maxAge: 0 });
        res.cookie("refreshToken", "", { ...refreshTokenOptions, expires: new Date(0), maxAge: 0 });

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

        const newAccessToken = jwt.sign(
            { id: decoded.id },
            env.accessTokenSecret,
            { expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE || "2"}h` as any }
        );

        const newRefreshToken = jwt.sign(
            { id: decoded.id },
            env.refreshTokenSecret,
            { expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE || "24"}h` as any }
        );

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

// 6. Update User Profile (Name & Phone Number - Session Authenticated Only)
export const updateUserProfile = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const { name, phoneNumber } = req.body;

        if (name !== undefined) {
            user.name = name;
        }
        if (phoneNumber !== undefined) {
            user.phoneNumber = phoneNumber;
        }

        await user.save();

        const sessionRaw = await redis.get(user._id.toString());
        if (sessionRaw) {
            const refreshTokenExpireInSeconds = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "24", 10) * 60 * 60;
            await redis.set(user._id.toString(), JSON.stringify(user), "EX", refreshTokenExpireInSeconds);
        }

        res.status(200).json({
            success: true,
            user,
        });
    }
);


// 7. Update User Avatar
export const updateUserAvatar = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        let existsUser = await User.findById(req.user._id);

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
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        const user = await User.findById(req.user._id);

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
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        const userId = req.user._id;
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
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        const user = await User.findById(req.user._id).select("+password");

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

        res.status(200).json({
            success: true,
            user,
        });
    }
);

// 12. Admin: Get All Users
export const getAllUsersAdmin = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { page, limit } = parsePagination(req.query, 20, 100);

        const [users, totalItems] = await Promise.all([
            User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            User.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            users,
            pagination: buildPaginationMeta(page, limit, totalItems),
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

        // Cascade delete / cleanup dependent data (reviews and conversations)
        await Product.updateMany(
            { "reviews.user": user._id },
            { $pull: { reviews: { user: user._id } } }
        );
        await Conversation.deleteMany({
            $or: [{ members: user._id }, { userId: user._id }, { users: user._id }]
        } as any);

        await User.findByIdAndDelete(req.params.id);
        await redis.del(user._id.toString());

        res.status(200).json({
            success: true,
            message: "User deleted successfully!",
        });
    }
);

// 14. Forgot Password
export const forgotPassword = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return next(new ErrorHandler("User not found with this email", 404));
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordTime = new Date(Date.now() + 15 * 60 * 1000);

        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset Request",
                message: `Hello ${user.name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes. If you did not request this, you can safely ignore this email.`,
            });

            res.status(200).json({
                success: true,
                message: `A password reset link has been sent to ${user.email}`,
            });
        } catch (error: any) {
            user.resetPasswordToken = undefined;
            user.resetPasswordTime = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new ErrorHandler(error.message || "Failed to send reset email", 500));
        }
    }
);

// 15. Reset Password
export const resetPassword = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return next(new ErrorHandler("Passwords do not match!", 400));
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(String(req.params.token || ""))
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordTime: { $gt: new Date() },
        }).select("+resetPasswordToken +resetPasswordTime");

        if (!user) {
            return next(new ErrorHandler("Reset password link is invalid or has expired", 400));
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordTime = undefined;

        await user.save();

        await redis.del(user._id.toString());

        res.status(200).json({
            success: true,
            message: "Password reset successfully! You can now log in with your new password.",
        });
    }
);

// 16. Get Wishlist (populated products)
export const getWishlist = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        const user = await User.findById(req.user._id).populate("wishlist");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        res.status(200).json({
            success: true,
            products: user.wishlist || [],
        });
    }
);

// 17. Add Product to Wishlist
export const addToWishlist = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        await User.updateOne(
            { _id: req.user._id },
            { $addToSet: { wishlist: productId } }
        );

        res.status(200).json({
            success: true,
            message: "Added to wishlist",
        });
    }
);

// 18. Remove Product from Wishlist
export const removeFromWishlist = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?._id) {
            return next(new ErrorHandler("User not found", 404));
        }

        const { productId } = req.params;

        await User.updateOne(
            { _id: req.user._id },
            { $pull: { wishlist: productId } }
        );

        res.status(200).json({
            success: true,
            message: "Removed from wishlist",
        });
    }
);
