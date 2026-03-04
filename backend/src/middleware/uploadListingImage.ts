import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { Request } from 'express';

const LISTINGS_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'listings');
const MAX_SIZE = 20 * 1024 * 1024; // 20MB per image
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function mimeToExt(mimetype: string): string {
  if (mimetype === 'image/jpeg') return '.jpg';
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  return '.jpg';
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(LISTINGS_IMAGES_DIR, { recursive: true });
    cb(null, LISTINGS_IMAGES_DIR);
  },
  filename(_req, file, cb) {
    const ext = mimeToExt(file.mimetype);
    const name = crypto.randomUUID() + ext;
    cb(null, name);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const uploadListingImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
}).single('image');
