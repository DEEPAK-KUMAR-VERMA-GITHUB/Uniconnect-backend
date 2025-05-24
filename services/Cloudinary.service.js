import cloudinary from "cloudinary";
import { ApiError } from "../utils/ApiError.js";

class Cloudinary {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      timeout: 120000, // Increase timeout to 120 seconds
    });
  }

  async uploadResource(file, resourceType) {
    try {
      const folderName = `uniconnect/${resourceType}s`;

      // Get the file buffer
      const fileBuffer = await file.toBuffer();

      // Use the upload method with buffer directly
      const uploadFileResult = await cloudinary.v2.uploader.upload(
        `data:${file.mimetype};base64,${fileBuffer.toString("base64")}`,
        {
          folder: folderName,
          use_filename: true,
          unique_filename: true,
          resource_type: "raw",
          timeout: 120000, // Increase timeout to 120 seconds
        }
      );

      return {
        public_id: uploadFileResult.public_id,
        url: uploadFileResult.secure_url,
        resource_type: uploadFileResult.resource_type,
      };
    } catch (error) {
      return ApiError.internal("Error uploading file to cloudinary", error);
    }
  }

  async deleteResource(public_id) {
    try {
      const result = await cloudinary.v2.uploader.destroy(public_id, {
        resource_type: "raw",
      });
      return result;
    } catch (error) {
      return ApiError.internal("Error deleting file from cloudinary", error);
    }
  }

  async getResource(public_id) {
    try {
      const result = await cloudinary.v2.api.resource(public_id, {
        resource_type: "raw",
      });
      return result;
    } catch (error) {
      return ApiError.internal("Error getting file from cloudinary", error);
    }
  }
}

export default new Cloudinary();
