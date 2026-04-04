export declare class CloudinaryService {
    uploadImage(file: Express.Multer.File, folder: string): Promise<{
        publicId: string;
        url: string;
    }>;
    uploadMultipleImages(files: Express.Multer.File[], folder: string): Promise<{
        publicId: string;
        url: string;
    }[]>;
    deleteImage(publicId: string): Promise<void>;
    /**
     * Upload a feature video to Cloudinary.
     * Cloudinary will transcode and validate duration server-side via eager transformations.
     * The maxDurationSeconds is enforced via a Cloudinary upload preset (recommended) or
     * manually checked via the returned duration field after upload.
     */
    uploadVideo(file: Express.Multer.File, folder: string, maxDurationSeconds: number): Promise<{
        publicId: string;
        url: string;
        duration: number;
    }>;
    deleteVideo(publicId: string): Promise<void>;
}
//# sourceMappingURL=cloudinaryService.d.ts.map