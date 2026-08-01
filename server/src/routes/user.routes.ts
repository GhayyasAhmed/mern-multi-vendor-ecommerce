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
} from "../controllers/user.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/create-user", createUser);
userRouter.post("/activation", activateUser);
userRouter.post("/login-user", loginUser);
userRouter.get("/getuser", isAuthenticated, getUserDetails);
userRouter.get("/logout", logoutUser);
userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
userRouter.put("/update-avatar", isAuthenticated, updateUserAvatar);
userRouter.put("/update-user-addresses", isAuthenticated, updateUserAddresses);
userRouter.delete("/delete-user-address/:id", isAuthenticated, deleteUserAddress);
userRouter.put("/update-user-password", isAuthenticated, updateUserPassword);
userRouter.get("/user-info/:id", getUserInfo);

// Admin Routes
userRouter.get("/admin-all-users", isAuthenticated, authorizeRoles("Admin"), getAllUsersAdmin);
userRouter.delete("/delete-user/:id", isAuthenticated, authorizeRoles("Admin"), deleteUserAdmin);

export default userRouter;