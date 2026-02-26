import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request } from 'express';

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function mimeToExt(mimetype: string): string {
  if (mimetype === 'image/jpeg') return '.jpg';
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  return '.jpg';
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
    cb(null, AVATAR_DIR);
  },
  filename(req: Request, file, cb) {
    const userId = req.user?.id;
    if (!userId) {
      cb(new Error('Unauthorized'), '');
      return;
    }
    const ext = mimeToExt(file.mimetype);
    cb(null, `${userId}${ext}`);
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

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
}).single('avatar');
