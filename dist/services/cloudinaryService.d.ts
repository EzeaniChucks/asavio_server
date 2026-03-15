export declare class CloudinaryService {
    uploadImage(file: Express.Multer.File, folder: string): Promise<any>;
    uploadMultipleImages(files: Express.Multer.File[], folder: string): Promise<any[]>;
    deleteImage(publicId: string): Promise<void>;
}
//# sourceMappingURL=cloudinaryService.d.ts.map