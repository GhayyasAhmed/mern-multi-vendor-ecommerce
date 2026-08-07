import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary.js";
import { redis } from "../config/redis.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ConversationModel from "../models/conversation.model.js";
import CouponCode from "../models/couponCode.model.js";
import EventModel from "../models/event.model.js";
import Product from "../models/product.model.js";
import Shop from "../models/shop.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendEmail from "../utils/sendEmail.js";
import sendShopToken from "../utils/shopToken.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { trackPendingUpload, clearPendingUpload, PENDING_SIGNUP_TTL_SECONDS } from "../utils/pendingUploads.js";
import { encryptSecret } from "../utils/crypto.js";

export interface IShopActivationToken {
  activationToken: string;
  expireMinutes: number;
}

export interface IShopActivationRequest {
  name: string;
  email: string;
  password?: string;
  address: string;
  phoneNumber: number;
  zipCode: number;
  avatar: {
    public_id: string;
    url: string;
  };
}

const refreshSellerSession = async (shop: any): Promise<void> => {
  const sanitized = typeof shop.toJSON === "function" ? shop.toJSON() : shop;
  await redis.set(
    `seller_${shop._id.toString()}`,
    JSON.stringify(sanitized),
    "EX",
    90 * 24 * 60 * 60
  );
};

// 1. Helper Function: Create and Save Activation Token in Redis
export const createActivationToken = async (
  shop: IShopActivationRequest
): Promise<IShopActivationToken> => {
  const activationToken = crypto.randomBytes(32).toString("hex");
  const expireMinutes = parseInt(process.env.JWT_EXPIRES || "5", 10);

  await redis.set(
    `activation:${activationToken}`,
    JSON.stringify(shop),
    "EX",
    Math.max(expireMinutes, 1) * 60
  );

  return { activationToken, expireMinutes };
};

// 2. Create Shop & Send Activation Mail
export const createShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, address, phoneNumber, zipCode, avatar } = req.body;

    if (!avatar) {
      return next(new ErrorHandler("Please upload a shop avatar", 400));
    }

    const existingShop = await Shop.findOne({ email });
    if (existingShop) {
      return next(new ErrorHandler("User/Shop already exists with this email", 400));
    }

    // Hash password before saving to Redis
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const cloudResult = await uploadToCloudinary(avatar, "avatars");

    const sellerData: IShopActivationRequest = {
      name,
      email,
      password: hashedPassword,
      address,
      phoneNumber,
      zipCode,
      avatar: {
        public_id: cloudResult.public_id,
        url: cloudResult.secure_url,
      },
    };

    const { activationToken, expireMinutes } = await createActivationToken(sellerData);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const activationUrl = `${frontendUrl}/activation/${activationToken}`;
    await redis.set(
      `pending_signup:shop:${email}`,
      JSON.stringify(sellerData),
      "EX",
      PENDING_SIGNUP_TTL_SECONDS
    );
    await trackPendingUpload(sellerData.avatar.public_id, Date.now() + PENDING_SIGNUP_TTL_SECONDS * 1000);
    try {
      await sendEmail({
        email: sellerData.email,
        subject: "Activate your Shop Account",
        message: `Hello ${sellerData.name},\n\nPlease click on the link to activate your shop:\n\n${activationUrl}\n\nThis link will expire in ${expireMinutes} minutes.`,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email (${sellerData.email}) to activate your shop!`,
      });
    } catch (error: any) {
      await redis.del(`activation:${activationToken}`);
      if (sellerData.avatar?.public_id) {
        await deleteFromCloudinary(sellerData.avatar.public_id);
      }
      await redis.del(`pending_signup:shop:${email}`);
      await clearPendingUpload(sellerData.avatar.public_id);
      return next(new ErrorHandler(error.message || "Failed to send activation email", 500));
    }
  }
);

// 3. Activate Shop via Token
export const activateShop = catchAsyncErrors(
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

    const sellerData: IShopActivationRequest = JSON.parse(redisData);

    const existingShop = await Shop.findOne({ email: sellerData.email });
    if (existingShop) {
      await redis.del(`activation:${activation_token}`);
      return next(new ErrorHandler("Shop already exists with this email", 400));
    }

    const seller = await Shop.create({
      name: sellerData.name,
      email: sellerData.email,
      avatar: sellerData.avatar,
      password: sellerData.password,
      zipCode: sellerData.zipCode,
      address: sellerData.address,
      phoneNumber: sellerData.phoneNumber,
    });

    await redis.del(`activation:${activation_token}`);
    await redis.del(`pending_signup:shop:${sellerData.email}`);
    await clearPendingUpload(sellerData.avatar.public_id);
    await sendShopToken(seller, 201, res, "Shop activated successfully!");
  }
);

// add new exported controller
export const resendActivation = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const existingShop = await Shop.findOne({ email });
    if (existingShop) {
      return next(new ErrorHandler("This shop is already activated. Please login.", 400));
    }

    const pendingRaw = await redis.get(`pending_signup:shop:${email}`);
    if (!pendingRaw) {
      return next(new ErrorHandler("No pending shop signup found for this email. Please sign up again.", 404));
    }

    const pendingSeller: IShopActivationRequest = JSON.parse(pendingRaw);

    const { activationToken, expireMinutes } = await createActivationToken(pendingSeller);

    await trackPendingUpload(pendingSeller.avatar.public_id, Date.now() + PENDING_SIGNUP_TTL_SECONDS * 1000);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const activationUrl = `${frontendUrl}/activation/${activationToken}`;

    try {
      await sendEmail({
        email: pendingSeller.email,
        subject: "Activate your Shop Account",
        message: `Hello ${pendingSeller.name},\n\nPlease click on the link to activate your shop:\n\n${activationUrl}\n\nThis link will expire in ${expireMinutes} minutes.`,
      });

      res.status(200).json({
        success: true,
        message: `A new activation link has been sent to ${pendingSeller.email}`,
      });
    } catch (error: any) {
      await redis.del(`activation:${activationToken}`);
      return next(new ErrorHandler(error.message || "Failed to send activation email", 500));
    }
  }
);


// 4. Login Shop
export const loginShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please provide all fields!", 400));
    }

    const shop = await Shop.findOne({ email }).select("+password");

    if (!shop) {
      return next(new ErrorHandler("User/Shop doesn't exist!", 400));
    }

    const isPasswordValid = await shop.comparePassword(password);

    if (!isPasswordValid) {
      return next(new ErrorHandler("Please provide the correct credentials", 400));
    }

    await sendShopToken(shop, 200, res, "Login successful");
  }
);

// 5. Get Logged-In Seller Details
export const getSellerDetails = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.seller?._id) {
      return next(new ErrorHandler("Seller not found", 400));
    }

    const seller = await Shop.findById(req.seller._id);

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 400));
    }

    res.status(200).json({
      success: true,
      seller,
    });
  }
);

// 6. Get Shop Info by Public ID
export const getShopInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const shop = await Shop.findById(req.params.id).select(
      "name description avatar address createdAt"
    );

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    res.status(200).json({
      success: true,
      shop,
    });
  }
);

// 7. Logout Shop
export const logoutShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.seller?._id;

    res.cookie("seller_token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    if (sellerId) {
      await redis.del(`seller_${sellerId.toString()}`);
    }

    res.status(200).json({
      success: true,
      message: "Log out successful!",
    });
  }
);

// 8. Update Shop Avatar
export const updateShopAvatar = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.seller?._id) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    const existingShop = await Shop.findById(req.seller._id);

    if (!existingShop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    if (req.body.avatar && req.body.avatar !== "") {
      if (existingShop.avatar?.public_id) {
        await deleteFromCloudinary(existingShop.avatar.public_id);
      }

      const cloudResult = await uploadToCloudinary(req.body.avatar, "avatars");

      existingShop.avatar = {
        public_id: cloudResult.public_id,
        url: cloudResult.secure_url,
      };
    }

    await existingShop.save();
    await refreshSellerSession(existingShop);

    res.status(200).json({
      success: true,
      shop: existingShop,
    });
  }
);

// 9. Update Seller Info
export const updateSellerInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, address, phoneNumber, zipCode } = req.body;

    if (!req.seller?._id) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    const shop = await Shop.findById(req.seller._id);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    if (name !== undefined) shop.name = name;
    if (description !== undefined) shop.description = description;
    if (address !== undefined) shop.address = address;
    if (phoneNumber !== undefined) shop.phoneNumber = phoneNumber;
    if (zipCode !== undefined) shop.zipCode = zipCode;

    await shop.save();
    await refreshSellerSession(shop);

    res.status(200).json({
      success: true,
      shop,
    });
  }
);

// 10. Update Payment/Withdraw Methods
export const updatePaymentMethods = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { withdrawMethod } = req.body;

    if (!req.seller?._id) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    const sanitizedWithdrawMethod = withdrawMethod
      ? { ...withdrawMethod, bankAccountNumber: encryptSecret(String(withdrawMethod.bankAccountNumber)) }
      : withdrawMethod;

    const shop = await Shop.findByIdAndUpdate(
      req.seller._id,
      { withdrawMethod: sanitizedWithdrawMethod },
      { new: true, runValidators: true }
    );

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    await refreshSellerSession(shop);

    res.status(200).json({ success: true, shop });
  }
);

// 11. Delete Withdraw Method
export const deleteWithdrawMethod = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.seller?._id) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    const shop = await Shop.findById(req.seller._id);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    shop.withdrawMethod = undefined;
    await shop.save();
    await refreshSellerSession(shop);

    res.status(200).json({
      success: true,
      shop,
    });
  }
);

// 12. Get All Sellers (Admin Only)
export const getAllSellers = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = parsePagination(req.query, 20, 100);

    const [sellers, totalItems] = await Promise.all([
      Shop.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Shop.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      sellers,
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);

// 13. Delete Seller (Admin Only)
export const deleteSeller = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const seller = await Shop.findById(req.params.id);

    if (!seller) {
      return next(
        new ErrorHandler("Seller is not available with this id", 400)
      );
    }

    if (seller.avatar?.public_id) {
      await deleteFromCloudinary(seller.avatar.public_id);
    }

    // Cascade delete dependent entities to prevent orphaned data
    await Product.deleteMany({ shopId: seller._id });
    await CouponCode.deleteMany({ shopId: seller._id });
    await EventModel.deleteMany({ shopId: seller._id });
    await ConversationModel.deleteMany({ shopId: seller._id });

    await Shop.findByIdAndDelete(req.params.id);
    await redis.del(`seller_${req.params.id}`);

    res.status(200).json({
      success: true,
      message: "Seller deleted successfully!",
    });
  }
);

// add new export
export const updateShopStatus = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status } = req.body as { status: "pending" | "active" | "suspended" };

    const shop = await Shop.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    await refreshSellerSession(shop);

    try {
      await sendEmail({
        email: shop.email,
        subject: "Your shop status has been updated",
        message: `Hello ${shop.name}, your shop status is now "${status}".`,
      });
    } catch {
      // best-effort
    }

    res.status(200).json({ success: true, shop });
  }
);