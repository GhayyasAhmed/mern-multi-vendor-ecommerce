import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
// import { initSocketServer } from "./socketServer.js";

// const server = http.createServer(app);
// initSocketServer(server);

console.log(
  "Connecting to Mongo URI:",
  env.mongoUri.replace(/:([^@]+)@/, ":****@")
);

async function startServer() {
  try {
    await connectDatabase();
    console.log(`Connected to MongoDB`);

    app.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void startServer();