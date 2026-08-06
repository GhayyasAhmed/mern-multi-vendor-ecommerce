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
    const imagesLinks: Array<{ public_id: string; url: string }> = [];
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

      const validImages = images.filter((img): img is string => Boolean(img));

      const uploadResults = await Promise.allSettled(
        validImages.map((image) => uploadToCloudinary(image, "products"))
      );

      const failedUpload = uploadResults.find(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (failedUpload) {
        const uploaded = uploadResults.filter(
          (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadToCloudinary>>> =>
            result.status === "fulfilled"
        );
        await Promise.all(uploaded.map((res) => deleteFromCloudinary(res.value.public_id)));
        throw failedUpload.reason;
      }

      for (const result of uploadResults) {
        if (result.status === "fulfilled") {
          imagesLinks.push({
            public_id: result.value.public_id,
            url: result.value.secure_url,
          });
        }
      }

      const productData = req.body;
      productData.images = imagesLinks;
      productData.shop = shop;

      const product = await ProductModel.create(productData);

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error: unknown) {
      if (imagesLinks.length > 0) {
        await Promise.all(
          imagesLinks.map((img) => deleteFromCloudinary(img.public_id))
        );
      }
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
      const deletePromises = images
        .map((img) => img?.public_id)
        .filter((publicId): publicId is string => Boolean(publicId))
        .map((publicId) => deleteFromCloudinary(publicId));

      await Promise.all(deletePromises);

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

// get all products (with pagination, category filter, search, sorting)
export const getAllProducts = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 50);
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const sortBy = (req.query.sortBy as string) || "newest";

      const filter: Record<string, any> = {};
      if (category) {
        filter.category = category;
      }
      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const sortOptions: Record<string, Record<string, 1 | -1>> = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        "best-selling": { sold_out: -1 },
        "price-low": { discountPrice: 1 },
        "price-high": { discountPrice: -1 },
      };
      const sort = sortOptions[sortBy] || sortOptions.newest;

      const [products, totalProducts] = await Promise.all([
        ProductModel.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit),
        ProductModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.max(Math.ceil(totalProducts / limit), 1),
          totalProducts,
          limit,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get single product by id
export const getProductById = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product not found with this id", 404));
    }

    res.status(200).json({
      success: true,
      product,
    });
  }
);

// get related products (same category, excluding current product)
export const getRelatedProducts = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const product = await ProductModel.findById(req.params.id).select("category");

    if (!product) {
      return next(new ErrorHandler("Product not found with this id", 404));
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 4, 1), 20);

    const relatedProducts = await ProductModel.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .sort({ sold_out: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      products: relatedProducts,
    });
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