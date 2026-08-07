import express from "express";
import {
    createShop, activateShop, resendActivation, loginShop, getSellerDetails, logoutShop,
    getShopInfo, updateShopAvatar, updateSellerInfo, updatePaymentMethods, deleteWithdrawMethod,
    getAllSellers, deleteSeller, updateShopStatus,
} from "../controllers/shop.controller.js";
import { isSeller, isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { ShopValidations, activationSchema, resendActivationSchema } from "../utils/validators.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/create-shop",authLimiter, validate(ShopValidations.createShopSchema), createShop);
router.post("/activation",authLimiter, validate(activationSchema), activateShop);
router.post("/resend-activation", authLimiter, validate(resendActivationSchema), resendActivation);
router.post("/login-shop",authLimiter, validate(ShopValidations.loginShopSchema), loginShop);
router.get("/getSeller", isSeller, getSellerDetails);
router.post("/logout", isSeller, logoutShop);
router.get("/get-shop-info/:id", getShopInfo);
router.put("/update-shop-avatar", isSeller, validate(ShopValidations.updateShopAvatarSchema), updateShopAvatar);
router.put("/update-seller-info", isSeller, validate(ShopValidations.updateSellerInfoSchema), updateSellerInfo);
router.put("/update-payment-methods", isSeller, validate(ShopValidations.updatePaymentMethodsSchema), updatePaymentMethods);
router.delete("/delete-withdraw-method", isSeller, deleteWithdrawMethod);
router.get("/admin-all-sellers", isAuthenticated, authorizeRoles("admin"), getAllSellers);
router.delete("/delete-seller/:id", isAuthenticated, authorizeRoles("admin"), deleteSeller);
router.put(
  "/admin-update-status/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  validate(ShopValidations.updateShopStatusSchema),
  updateShopStatus
);

export default router;