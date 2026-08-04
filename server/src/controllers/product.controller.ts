import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ProductModel, { IReview } from "../models/product.model.js";
import OrderModel from "../models/order.model.js";
import ShopModel from "../models/shop.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// create product
export const createProduct = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.body.shopId;
      const shop = await ShopModel.findById(shopId);

      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      }

      let images: string[] = [];

      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else if (Array.isArray(req.body.images)) {
        images = req.body.images;
      }

      // const imagesLinks: Array<{ public_id: string; url: string }> = [];

      // for (let i = 0; i < images.length; i++) {
      //   const image = images[i];
      //   if (!image) continue;

      //   const result = await uploadToCloudinary(image, "products");

      //   imagesLinks.push({
      //     public_id: result.public_id,
      //     url: result.secure_url,
      //   });
      // }

      const imagesLinks = await Promise.all(
        images
          .filter((img): img is string => Boolean(img))
          .map(async (image) => {
            const result = await uploadToCloudinary(image, "products");
            return {
              public_id: result.public_id,
              url: result.secure_url,
            };
          })
      );

      const productData = req.body;
      productData.images = imagesLinks;
      productData.shop = shop;

      const product = await ProductModel.create(productData);

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get all products of a shop
export const getAllProductsShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await ProductModel.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// delete product of a shop
export const deleteProduct = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }

      const images = product.images || [];
      for (let i = 0; i < images.length; i++) {
        const publicId = images[i]?.public_id;
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }

      await ProductModel.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get all products
export const getAllProducts = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await ProductModel.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// review for a product
export const createNewReview = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await ProductModel.findById(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      const review: IReview = {
        user,
        rating,
        comment,
        productId,
      };

      const reviewsList = product.reviews || [];

      const isReviewed = reviewsList.find((rev: IReview) => {
        const revUserId =
          typeof rev.user === "object" && rev.user !== null && "_id" in rev.user
            ? String((rev.user as { _id: unknown })._id)
            : String(rev.user);
        return revUserId === String(req.user?._id);
      });

      if (isReviewed) {
        reviewsList.forEach((rev: IReview) => {
          const revUserId =
            typeof rev.user === "object" && rev.user !== null && "_id" in rev.user
              ? String((rev.user as { _id: unknown })._id)
              : String(rev.user);

          if (revUserId === String(req.user?._id)) {
            rev.rating = rating;
            rev.comment = comment;
            rev.user = user;
          }
        });
      } else {
        reviewsList.push(review);
      }

      product.reviews = reviewsList;

      let avg = 0;

      product.reviews.forEach((rev: IReview) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await OrderModel.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// all products --- for admin
export const getAdminAllProducts = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await ProductModel.find().sort({
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);