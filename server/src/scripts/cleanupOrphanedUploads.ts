import "dotenv/config";
import { redis } from "../config/redis.js";
import connectCloudinary, { deleteFromCloudinary } from "../config/cloudinary.js";
import { getExpiredPendingUploads, removeExpiredPendingUploads } from "../utils/pendingUploads.js";

connectCloudinary();

async function cleanupOrphanedUploads() {
  const now = Date.now();
  const expiredPublicIds = await getExpiredPendingUploads(now);

  if (expiredPublicIds.length === 0) {
    return
  } else {
    for (const publicId of expiredPublicIds) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error(`Failed to delete orphaned avatar ${publicId}:`, error);
      }
    }

    await removeExpiredPendingUploads(expiredPublicIds);
  }

  await redis.quit();
  process.exit(0);
}

cleanupOrphanedUploads().catch((error) => {
  console.error("Failed to run orphaned uploads cleanup:", error);
  process.exit(1);
});