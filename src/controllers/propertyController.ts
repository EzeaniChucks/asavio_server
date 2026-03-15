// src/controllers/propertyController.ts
import { Request, Response } from "express";
import { PropertyService } from "../services/propertyService";
import { CloudinaryService } from "../services/cloudinaryService";
import { emailService } from "../services/emailService";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { catchAsync } from "../utils/catchAsync";

const propertyService = new PropertyService();
const cloudinaryService = new CloudinaryService();

export const propertyController = {
  createProperty: catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    let uploadedImages = [];

    if (files && files.length > 0) {
      uploadedImages = await cloudinaryService.uploadMultipleImages(
        files,
        "properties"
      );
    }

    const property = await propertyService.createProperty(
      req.body,
      req.user.id,
      uploadedImages
    );

    // Notify all admins of the new pending listing (best-effort)
    AppDataSource.getRepository(User)
      .find({ where: { role: "admin" } })
      .then((admins) =>
        Promise.all(
          admins.map((admin) =>
            emailService
              .sendListingSubmitted({
                to: admin.email,
                propertyTitle: property.title,
                hostName: req.user.firstName ?? "A host",
                propertyId: property.id,
              })
              .catch(console.error)
          )
        )
      )
      .catch(console.error);

    res.status(201).json({
      status: "success",
      data: { property },
    });
  }),

  getProperty: catchAsync(async (req: Request, res: Response) => {
    const property = await propertyService.getPropertyById(req.params.id as string);

    res.status(200).json({
      status: "success",
      data: { property },
    });
  }),

  getAllProperties: catchAsync(async (req: Request, res: Response) => {
    const properties = await propertyService.getAllProperties(req.query);

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: { properties },
    });
  }),

  getMyProperties: catchAsync(async (req: Request, res: Response) => {
    const properties = await propertyService.getMyProperties(req.user.id);

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: { properties },
    });
  }),

  getAvailablePropertyTypes: catchAsync(async (_req: Request, res: Response) => {
    const types = await propertyService.getAvailablePropertyTypes();

    res.status(200).json({
      status: "success",
      data: { types },
    });
  }),

  updateProperty: catchAsync(async (req: Request, res: Response) => {
    const property = await propertyService.updateProperty(
      req.params.id as string,
      req.body,
      req.user.id
    );

    res.status(200).json({
      status: "success",
      data: { property },
    });
  }),

  deleteProperty: catchAsync(async (req: Request, res: Response) => {
    await propertyService.deleteProperty(req.params.id as string, req.user.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }),
};
