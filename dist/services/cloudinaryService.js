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
}
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=cloudinaryService.js.map