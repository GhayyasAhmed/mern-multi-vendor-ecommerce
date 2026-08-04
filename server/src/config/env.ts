import "dotenv/config";

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readOrigins(value: string | undefined): string[] {
  if (!value) {
    return ["http://localhost:5173"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || "development";

function readSecret(value: string | undefined, name: string, devFallback: string): string {
  if (value) {
    return value;
  }
  if (nodeEnv !== "development") {
    throw new Error(`${name} is required outside development.`);
  }
  return devFallback;
}

const mongoUri = process.env.MONGO_URI;

if (nodeEnv !== "development" && !mongoUri) {
  throw new Error("MONGO_URI is required outside development.");
}

export const env = {
  nodeEnv,
  port: readNumber(process.env.PORT, 3001),
  mongoUri: mongoUri || "mongodb://127.0.0.1:27017/multi-vendor-ecommerce",
  allowedOrigins: readOrigins(process.env.FRONTEND_URL),
  accessTokenSecret: readSecret(process.env.ACCESS_TOKEN, "ACCESS_TOKEN", "dev_access_secret"),
  refreshTokenSecret: readSecret(process.env.REFRESH_TOKEN, "REFRESH_TOKEN", "dev_refresh_secret"),
  jwtSecretKey: readSecret(process.env.JWT_SECRET_KEY, "JWT_SECRET_KEY", "dev_jwt_secret"),
};