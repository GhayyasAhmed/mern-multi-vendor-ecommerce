import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ProductModel, { IReview } from "../models/product.model.js";
import OrderModel from "../models/order.model.js";
import ShopModel from "../models/shop.model.js";
import EventModel from "../models/event.model.js";
import CouponCodeModel from "../models/couponCode.model.js";
import ConversationModel from "../models/conversation.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// Helper function to escape special regex metacharacters
const escapeRegex = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// create product
export const createProduct = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sellerId = req.seller?._id;

    if (!sellerId) {
      return next(new ErrorHandler("Seller not found in request", 400));
    }

    const shop = await ShopModel.findById(sellerId);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
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

    const imagesLinks: Array<{ public_id: string; url: string }> = [];

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
    productData.shopId = String(sellerId);

    // Targeted compensating cleanup: if database insertion fails, remove uploaded Cloudinary images first
    try {
      const product = await ProductModel.create(productData);

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      if (imagesLinks.length > 0) {
        await Promise.all(
          imagesLinks.map((img) => deleteFromCloudinary(img.public_id))
        );
      }
      throw error;
    }
  }
);

// get all products of a shop
export const getAllProductsShop = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const products = await ProductModel.find({ shopId: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  }
);

// delete product of a shop
export const deleteProduct = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product is not found with this id", 404));
    }

    if (String(product.shopId) !== String(req.seller?._id)) {
      return next(new ErrorHandler("You are not authorized to delete this product", 403));
    }

    const images = product.images || [];
    const deletePromises = images
      .map((img) => img?.public_id)
      .filter((publicId): publicId is string => Boolean(publicId))
      .map((publicId) => deleteFromCloudinary(publicId));

    await Promise.all(deletePromises);

    // Cascade delete dependent entities if required or cleanup references
    await CouponCodeModel.deleteMany({ productIds: product._id });
    await ConversationModel.deleteMany({ productId: product._id });

    await ProductModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product Deleted successfully!",
    });
  }
);

// get all products (with pagination, category filter, search, sorting)
export const getAllProducts = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const escapedSearch = escapeRegex(search.trim());
      filter.name = { $regex: escapedSearch, $options: "i" };
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
    const { user, rating, comment, productId, orderId } = req.body;

    if (!req.user?._id) {
      return next(new ErrorHandler("User authentication required", 401));
    }

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

    product.ratings = product.reviews.length > 0 ? avg / product.reviews.length : 0;

    await product.save({ validateBeforeSave: false });

    await OrderModel.findByIdAndUpdate(
      orderId,
      { $set: { "cart.$[elem].isReviewed": true } },
      { arrayFilters: [{ "elem._id": productId }], new: true }
    );

    res.status(200).json({
      success: true,
      message: "Reviewed successfully!",
    });
  }
);

// all products --- for admin
export const getAdminAllProducts = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const products = await ProductModel.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      products,
    });
  }
);