"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
// src/services/cloudinaryService.ts
const cloudinary_1 = require("cloudinary");
const cloudinary_2 = require("../config/cloudinary");
const AppError_1 = require("../utils/AppError");
cloudinary_1.v2.config(cloudinary_2.config);
class CloudinaryService {
    async uploadImage(file, folder) {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_stream({ folder: `asavio/${folder}`, use_filename: true }, (error, result) => {
                if (error || !result) {
                    return reject(new AppError_1.AppError("Error uploading image to Cloudinary", 500));
                }
                resolve({ publicId: result.public_id, url: result.secure_url });
            }).end(file.buffer);
        });
    }
    async uploadMultipleImages(files, folder) {
        const uploadPromises = files.map((file) => this.uploadImage(file, folder));
        return Promise.all(uploadPromises);
    }
    async deleteImage(publicId) {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        catch (error) {
            throw new AppError_1.AppError("Error deleting image from Cloudinary", 500);
        }
    }
    /**
     * Upload a feature video to Cloudinary.
     * Cloudinary will transcode and validate duration server-side via eager transformations.
     * The maxDurationSeconds is enforced via a Cloudinary upload preset (recommended) or
     * manually checked via the returned duration field after upload.
     */
    async uploadVideo(file, folder, maxDurationSeconds) {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_stream({
                resource_type: "video",
                folder: `asavio/${folder}`,
                use_filename: true,
                // Request Cloudinary to return video metadata including duration
                eager: [{ format: "mp4" }],
                eager_async: false,
            }, (error, result) => {
                if (error || !result) {
                    return reject(new AppError_1.AppError("Error uploading video to Cloudinary", 500));
                }
                const duration = result.duration ?? 0;
                if (duration > maxDurationSeconds) {
                    // Delete the just-uploaded video since it's too long
                    cloudinary_1.v2.uploader.destroy(result.public_id, { resource_type: "video" }).catch(() => { });
                    return reject(new AppError_1.AppError(`Video is too long (${Math.round(duration)}s). Maximum allowed is ${maxDurationSeconds} seconds for your plan.`, 400));
                }
                resolve({
                    publicId: result.public_id,
                    url: result.secure_url,
                    duration,
                });
            }).end(file.buffer);
        });
    }
    async deleteVideo(publicId) {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: "video" });
        }
        catch {
            throw new AppError_1.AppError("Error deleting video from Cloudinary", 500);
        }
    }
}
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=cloudinaryService.js.map