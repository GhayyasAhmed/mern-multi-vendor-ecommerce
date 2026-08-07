import "dotenv/config";
import { redis } from "../config/redis.js";
import connectCloudinary, { deleteFromCloudinary } from "../config/cloudinary.js";
import { getExpiredPendingUploads, removeExpiredPendingUploads } from "../utils/pendingUploads.js";

connectCloudinary();

async function cleanupOrphanedUploads() {
  const now = Date.now();
  const expiredPublicIds = await getExpiredPendingUploads(now);

  if (expiredPublicIds.length === 0) {
    console.log("No orphaned avatar uploads to clean up.");
  } else {
    console.log(`Found ${expiredPublicIds.length} orphaned avatar upload(s). Deleting from Cloudinary...`);

    for (const publicId of expiredPublicIds) {
      try {
        await deleteFromCloudinary(publicId);
        console.log(`Deleted orphaned avatar: ${publicId}`);
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