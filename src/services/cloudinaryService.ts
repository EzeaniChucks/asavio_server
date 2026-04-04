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

  /**
   * Upload a feature video to Cloudinary.
   * Cloudinary will transcode and validate duration server-side via eager transformations.
   * The maxDurationSeconds is enforced via a Cloudinary upload preset (recommended) or
   * manually checked via the returned duration field after upload.
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder: string,
    maxDurationSeconds: number
  ): Promise<{ publicId: string; url: string; duration: number }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: `asavio/${folder}`,
          use_filename: true,
          // Request Cloudinary to return video metadata including duration
          eager: [{ format: "mp4" }],
          eager_async: false,
        },
        (error, result) => {
          if (error || !result) {
            return reject(new AppError("Error uploading video to Cloudinary", 500));
          }

          const duration = result.duration ?? 0;
          if (duration > maxDurationSeconds) {
            // Delete the just-uploaded video since it's too long
            cloudinary.uploader.destroy(result.public_id, { resource_type: "video" }).catch(() => {});
            return reject(
              new AppError(
                `Video is too long (${Math.round(duration)}s). Maximum allowed is ${maxDurationSeconds} seconds for your plan.`,
                400
              )
            );
          }

          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            duration,
          });
        }
      ).end(file.buffer);
    });
  }

  async deleteVideo(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    } catch {
      throw new AppError("Error deleting video from Cloudinary", 500);
    }
  }
}
