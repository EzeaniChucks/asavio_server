// src/services/cloudinaryService.ts
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/cloudinary";
import { AppError } from "../utils/AppError";

cloudinary.config(config);

export class CloudinaryService {
  async uploadImage(file: Express.Multer.File, folder: string): Promise<{ publicId: string; url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `asavio/${folder}`, use_filename: true },
        (error, result) => {
          if (error || !result) {
            return reject(new AppError("Error uploading image to Cloudinary", 500));
          }
          resolve({ publicId: result.public_id, url: result.secure_url });
        }
      ).end(file.buffer);
    });
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
