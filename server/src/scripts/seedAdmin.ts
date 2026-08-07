import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "../models/user.model.js";
import { env } from "../config/env.js";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);

  const existing = await UserModel.findOne({ email });

  if (existing) {
    if (existing.role === "admin") {
      console.log(`User ${email} is already an admin.`);
    } else {
      existing.role = "admin";
      await existing.save();
      console.log(`Promoted existing user ${email} to admin.`);
    }
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log(`Created new admin user ${email}.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user:", error);
  process.exit(1);
});