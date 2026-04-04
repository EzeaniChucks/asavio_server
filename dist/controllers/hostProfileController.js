"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostProfileController = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Property_1 = require("../entities/Property");
const cloudinaryService_1 = require("../services/cloudinaryService");
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
const PUBLIC_USER_SELECT = [
    "id", "firstName", "lastName", "profileImage",
    "bio", "languages", "occupation", "city", "whyIHost", "school",
    "isVerified", "responseRate", "hostTier", "createdAt",
];
exports.hostProfileController = {
    /** GET /api/hosts/:id — public, no auth required */
    getPublicProfile: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const propertyRepo = database_1.AppDataSource.getRepository(Property_1.Property);
        const host = await userRepo.findOne({
            where: { id: req.params.id, role: "host" },
            select: PUBLIC_USER_SELECT,
        });
        if (!host)
            throw new AppError_1.AppError("Host not found", 404);
        const properties = await propertyRepo.find({
            where: { hostId: host.id, status: "approved", isAvailable: true },
            relations: ["images"],
            take: 6,
            order: { createdAt: "DESC" },
        });
        res.json({ status: "success", data: { host, properties } });
    }),
    /** PATCH /api/users/profile — authenticated host updates own profile */
    updateProfile: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { bio, languages, occupation, city, whyIHost, school } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const update = {
            bio: bio != null ? String(bio).trim() || null : undefined,
            occupation: occupation ? String(occupation).trim() || null : null,
            city: city ? String(city).trim() || null : null,
            whyIHost: whyIHost != null ? String(whyIHost).trim() || null : undefined,
            school: school ? String(school).trim() || null : null,
        };
        if (languages !== undefined) {
            update.languages = Array.isArray(languages)
                ? languages.filter(Boolean)
                : typeof languages === "string"
                    ? JSON.parse(languages)
                    : null;
        }
        await userRepo.update(req.user.id, update);
        const updated = await userRepo.findOne({ where: { id: req.user.id } });
        res.json({ status: "success", data: { user: updated } });
    }),
    /** POST /api/users/profile/photo — authenticated host uploads profile photo */
    uploadProfilePhoto: (0, catchAsync_1.catchAsync)(async (req, res) => {
        if (!req.file)
            throw new AppError_1.AppError("No file uploaded", 400);
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: req.user.id } });
        if (user?.profileImagePublicId) {
            await cloudinaryService.deleteImage(user.profileImagePublicId).catch(() => null);
        }
        const result = await cloudinaryService.uploadImage(req.file, "profiles");
        await userRepo.update(req.user.id, {
            profileImage: result.url,
            profileImagePublicId: result.publicId,
        });
        res.json({ status: "success", data: { profileImage: result.url } });
    }),
};
//# sourceMappingURL=hostProfileController.js.map