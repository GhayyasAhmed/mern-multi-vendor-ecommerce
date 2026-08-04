import express from "express";
import {
  createUser,
  activateUser,
  loginUser,
  getUserDetails,
  logoutUser,
  updateUserInfo,
  updateUserAvatar,
  updateUserAddresses,
  deleteUserAddress,
  updateUserPassword,
  getUserInfo,
  getAllUsersAdmin,
  deleteUserAdmin,
  refreshAccessToken
} from "../controllers/user.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { UserValidations, activationSchema } from "../utils/validators.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const userRouter = express.Router();

userRouter.post("/create-user", authLimiter, validate(UserValidations.createUserSchema), createUser);
userRouter.post("/activation", authLimiter, validate(activationSchema), activateUser);
userRouter.post("/login-user", authLimiter, validate(UserValidations.loginUserSchema), loginUser);
userRouter.get("/getuser", isAuthenticated, getUserDetails);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.put("/update-user-info", isAuthenticated, validate(UserValidations.updateUserInfoSchema), updateUserInfo);
userRouter.put("/update-avatar", isAuthenticated, validate(UserValidations.updateUserAvatarSchema), updateUserAvatar);
userRouter.put("/update-user-addresses", isAuthenticated, validate(UserValidations.updateUserAddressesSchema), updateUserAddresses);
userRouter.delete("/delete-user-address/:id", isAuthenticated, deleteUserAddress);
userRouter.put("/update-user-password", isAuthenticated, validate(UserValidations.updateUserPasswordSchema), updateUserPassword);
userRouter.get("/user-info/:id", getUserInfo);

// Admin Routes
userRouter.get("/admin-all-users", isAuthenticated, authorizeRoles("admin"), getAllUsersAdmin);
userRouter.delete("/delete-user/:id", isAuthenticated, authorizeRoles("admin"), deleteUserAdmin);

export default userRouter;