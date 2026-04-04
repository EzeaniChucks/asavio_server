// src/controllers/hostProfileController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { CloudinaryService } from "../services/cloudinaryService";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

const cloudinaryService = new CloudinaryService();

const PUBLIC_USER_SELECT: (keyof User)[] = [
  "id", "firstName", "lastName", "profileImage",
  "bio", "languages", "occupation", "city", "whyIHost", "school",
  "isVerified", "responseRate", "hostTier", "createdAt",
];

export const hostProfileController = {
  /** GET /api/hosts/:id — public, no auth required */
  getPublicProfile: catchAsync(async (req: Request, res: Response) => {
    const userRepo = AppDataSource.getRepository(User);
    const propertyRepo = AppDataSource.getRepository(Property);

    const host = await userRepo.findOne({
      where: { id: req.params.id as string, role: "host" },
      select: PUBLIC_USER_SELECT,
    });
    if (!host) throw new AppError("Host not found", 404);

    const properties = await propertyRepo.find({
      where: { hostId: host.id, status: "approved", isAvailable: true },
      relations: ["images"],
      take: 6,
      order: { createdAt: "DESC" },
    });

    res.json({ status: "success", data: { host, properties } });
  }),

  /** PATCH /api/users/profile — authenticated host updates own profile */
  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const { bio, languages, occupation, city, whyIHost, school } = req.body;
    const userRepo = AppDataSource.getRepository(User);

    const update: Partial<User> = {
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
  uploadProfilePhoto: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) throw new AppError("No file uploaded", 400);
    const userRepo = AppDataSource.getRepository(User);

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
