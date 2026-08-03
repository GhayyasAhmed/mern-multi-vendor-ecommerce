import express from "express";
import {
    createShop,
    activateShop,
    loginShop,
    getSellerDetails,
    logoutShop,
    getShopInfo,
    updateShopAvatar,
    updateSellerInfo,
    updatePaymentMethods,
    deleteWithdrawMethod,
    getAllSellers, deleteSeller
} from "../controllers/shop.controller.js";
import { isSeller, isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create-shop", createShop);
router.post("/activation", activateShop);
router.post("/login-shop", loginShop);
router.get("/getSeller", isSeller, getSellerDetails);
router.get("/logout", logoutShop);
router.get("/get-shop-info/:id", getShopInfo);
router.put("/update-shop-avatar", isSeller, updateShopAvatar);
router.put("/update-seller-info", isSeller, updateSellerInfo);
router.put("/update-payment-methods", isSeller, updatePaymentMethods);
router.delete("/delete-withdraw-method", isSeller, deleteWithdrawMethod);
router.get("/admin-all-sellers", isAuthenticated, authorizeRoles("admin"), getAllSellers);
router.delete("/delete-seller/:id", isAuthenticated, authorizeRoles("admin"), deleteSeller);

export default router;