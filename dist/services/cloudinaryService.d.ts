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
}
//# sourceMappingURL=cloudinaryService.d.ts.map