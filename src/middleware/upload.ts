// src/middleware/upload.ts
import multer from "multer";
import path from "path";
import { AppError } from "../utils/AppError";
import { Request } from "express";

// Memory storage — no temp directory needed; files are in file.buffer
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files (jpeg, jpg, png, webp) are allowed", 400));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter,
});
