import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary.js";
import { redis } from "../config/redis.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import Shop from "../models/shop.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendShopToken from "../utils/shopToken.js";
import sendEmail from "../utils/sendEmail.js";

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
    try {
      const { name, email, password, address, phoneNumber, zipCode, avatar } = req.body;

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
        return next(new ErrorHandler(error.message || "Failed to send activation email", 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// 3. Activate Shop via Token
export const activateShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      await sendShopToken(seller, 201, res, "Shop activated successfully!");
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 4. Login Shop
export const loginShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      await sendShopToken(shop, 201, res, "Login successful");
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 5. Get Logged-In Seller Details
export const getSellerDetails = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seller = await Shop.findById((req as any).user._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 400));
      }

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 6. Get Shop Info by Public ID
export const getShopInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {

      const shop = await Shop.findById(req.params.id).select(
        "name description avatar address"
      );

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 7. Logout Shop
export const logoutShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sellerId = (req as any).seller?._id;

      res.cookie("seller_token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      if (sellerId) {
        await redis.del(`seller_${sellerId.toString()}`);
      }

      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 8. Update Shop Avatar
export const updateShopAvatar = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existingShop = await Shop.findById((req as any).user._id);

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

      res.status(200).json({
        success: true,
        shop: existingShop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 9. Update Seller Info
export const updateSellerInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, address, phoneNumber, zipCode } = req.body;

      const shop = await Shop.findById((req as any).user._id);

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      if (name !== undefined) shop.name = name;
      if (description !== undefined) shop.description = description;
      if (address !== undefined) shop.address = address;
      if (phoneNumber !== undefined) shop.phoneNumber = phoneNumber;
      if (zipCode !== undefined) shop.zipCode = zipCode;

      await shop.save();

      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 10. Update Payment/Withdraw Methods
export const updatePaymentMethods = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { withdrawMethod } = req.body;

      const shop = await Shop.findByIdAndUpdate(
        (req as any).user._id,
        { withdrawMethod },
        { new: true, runValidators: true }
      );

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 11. Delete Withdraw Method
export const deleteWithdrawMethod = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shop = await Shop.findById((req as any).user._id);

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      shop.withdrawMethod = undefined;
      await shop.save();

      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// 12. Get All Sellers (Admin Only)
export const getAllSellers = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        sellers,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 13. Delete Seller (Admin Only)
export const deleteSeller = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }

      await Shop.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);