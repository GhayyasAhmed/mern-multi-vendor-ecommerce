import express from "express";
import {
  createProduct,
  getAllProductsShop,
  deleteProduct,
  getAllProducts,
  createNewReview,
  getAdminAllProducts,
} from "../controllers/product.controller.js";
import { isSeller, isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const productRouter = express.Router();

productRouter.post("/create-product", isSeller, createProduct);
productRouter.get("/get-all-products-shop/:id", getAllProductsShop);
productRouter.delete("/delete-shop-product/:id", isSeller, deleteProduct);
productRouter.get("/get-all-products", getAllProducts);
productRouter.put("/create-new-review", isAuthenticated, createNewReview);

// admin routes
productRouter.get(
  "/admin-all-products",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllProducts
);

export default productRouter;