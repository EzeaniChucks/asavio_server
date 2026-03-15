// src/controllers/propertyController.ts
import { Request, Response } from "express";
import { PropertyService } from "../services/propertyService";
import { CloudinaryService } from "../services/cloudinaryService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

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
