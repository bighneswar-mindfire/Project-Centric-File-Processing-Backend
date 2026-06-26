import multer from 'multer';
import path from 'path';
import fs from 'fs';

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const ALLOWED_TYPES = ['image/', 'application/pdf', 'text/', 'application/zip', 'video/'];

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.some((type) => file.mimetype.startsWith(type))) {
      return cb(
        new Error(
          'File type not allowed. Only images, PDFs, text documents, ZIP archives, and videos are allowed.',
        ),
      );
    }
    cb(null, true);
  },
});
