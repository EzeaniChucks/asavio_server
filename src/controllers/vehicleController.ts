// src/controllers/vehicleController.ts
import { Request, Response, NextFunction } from "express";
import { vehicleService } from "../services/vehicleService";
import { catchAsync } from "../utils/catchAsync";

export const vehicleController = {
  getAvailableVehicleTypes: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const types = await vehicleService.getAvailableVehicleTypes();
    res.status(200).json({ status: "success", data: { types } });
  }),

  listVehicles: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const {
      vehicleType,
      minPrice,
      maxPrice,
      withDriver,
      location,
      seats,
      sort,
      page,
      limit,
    } = req.query;

    const result = await vehicleService.getVehicles({
      vehicleType: vehicleType as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      withDriver: withDriver !== undefined ? withDriver === "true" : undefined,
      location: location as string,
      seats: seats ? Number(seats) : undefined,
      sort: sort as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });

    res.json({ status: "success", data: result });
  }),

  getVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    res.json({ status: "success", data: { vehicle } });
  }),

  createVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const vehicle = await vehicleService.createVehicle(req.user!.id, req.body, files);
    res.status(201).json({ status: "success", data: { vehicle } });
  }),

  updateVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const vehicle = await vehicleService.updateVehicle(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      req.body,
      files.length ? files : undefined
    );
    res.json({ status: "success", data: { vehicle } });
  }),

  deleteVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await vehicleService.deleteVehicle(req.params.id as string, req.user!.id, req.user!.role);
    res.status(204).send();
  }),

  toggleAvailability: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicle = await vehicleService.toggleAvailability(req.params.id as string, req.user!.id);
    res.json({ status: "success", data: { vehicle } });
  }),

  getMyVehicles: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicles = await vehicleService.getHostVehicles(req.user!.id);
    res.json({ status: "success", data: { vehicles } });
  }),
};
