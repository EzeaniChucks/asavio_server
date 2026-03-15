// src/services/cloudinaryService.ts
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/cloudinary";
import { AppError } from "../utils/AppError";

cloudinary.config(config);

export class CloudinaryService {
  async uploadImage(file: Express.Multer.File, folder: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `asavio/${folder}`,
        use_filename: true,
      });
      return {
        publicId: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      throw new AppError("Error uploading image to Cloudinary", 500);
    }
  }

  async uploadMultipleImages(files: Express.Multer.File[], folder: string) {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new AppError("Error deleting image from Cloudinary", 500);
    }
  }
}
