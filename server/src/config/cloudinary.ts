import { v2 as cloudinary, UploadApiResponse, DeleteApiResponse } from 'cloudinary';

/**
 * Configure Cloudinary with environment credentials
 */
const connectCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

/**
 * Uploads a file (base64 string or local file path) to Cloudinary
 * 
 * @param file - Base64 data URI string or path to a local temporary file
 * @param folder - Cloudinary directory path to store the file
 */
export const uploadToCloudinary = async (
  file: string,
  folder: string = 'shops'
): Promise<UploadApiResponse> => {
  try {
    const response = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
    });

    return response;
  } catch (error) {
    throw new Error(`Cloudinary Upload Failed: ${(error as Error).message}`);
  }
};

/**
 * Deletes an asset from Cloudinary using its public_id
 * 
 * @param publicId - The public_id of the file saved on Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string
): Promise<DeleteApiResponse> => {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    throw new Error(`Cloudinary Deletion Failed: ${(error as Error).message}`);
  }
};

export default connectCloudinary;