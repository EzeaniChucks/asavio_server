// src/middleware/upload.ts
import multer from "multer";
import path from "path";
import { AppError } from "../utils/AppError";
import { Request } from "express";

// Memory storage — no temp directory needed; files are in file.buffer
const storage = multer.memoryStorage();

const imageFileFilter = (
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

const videoFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExts = /mp4|mov|m4v/;
  const allowedMimes = /video\/(mp4|quicktime|x-m4v)/;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedMimes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new AppError("Only video files (mp4, mov) are allowed", 400));
  }
};

/** For property/vehicle image uploads — 5 MB per file */
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

/** For feature video uploads — 100 MB max (Elite limit; enforced further in controller) */
export const uploadVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: videoFileFilter,
});
