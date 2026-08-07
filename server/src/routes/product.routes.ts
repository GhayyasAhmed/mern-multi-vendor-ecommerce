import express from "express";
import {
  createProduct, getAllProductsShop, deleteProduct, getAllProducts, getProductById,
  getRelatedProducts, createNewReview, getAdminAllProducts, updateProduct, checkAvailability,
  getReviewEligibility,
} from "../controllers/product.controller.js";
import { isSeller, isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { ProductValidations } from "../utils/validators.js";

const productRouter = express.Router();

productRouter.post(
  "/create-product",
  isSeller,
  validate(ProductValidations.createProductSchema),
  createProduct
);
productRouter.get("/get-all-products-shop/:id", getAllProductsShop);
productRouter.delete("/delete-shop-product/:id", isSeller, deleteProduct);
productRouter.put(
  "/update-product/:id",
  isSeller,
  validate(ProductValidations.updateProductSchema),
  updateProduct
);
productRouter.post(
  "/check-availability",
  validate(ProductValidations.checkAvailabilitySchema),
  checkAvailability
);
productRouter.get("/get-all-products", getAllProducts);
productRouter.get("/get-product/:id", getProductById);
productRouter.get("/get-related-products/:id", getRelatedProducts);
productRouter.put(
  "/create-new-review",
  isAuthenticated,
  validate(ProductValidations.createReviewSchema),
  createNewReview
);
productRouter.get("/review-eligibility/:id", isAuthenticated, getReviewEligibility);

// admin routes
productRouter.get(
  "/admin-all-products",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllProducts
);

export default productRouter;