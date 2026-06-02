'use strict';
const path = require('path');
const fs   = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'photos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

let uploadPhoto = (req, res, next) =>
  res.status(503).json({ message: 'Photo upload unavailable. Run: npm install' });

try {
  const multer       = require('multer');
  const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `teacher_${req.user?.id || Date.now()}${ext}`);
    },
  });
  uploadPhoto = multer({
    storage:    photoStorage,
    limits:     { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
      /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)
        ? cb(null, true)
        : cb(new Error('Only JPG/PNG/WEBP images allowed')),
  }).single('photo');
} catch (e) {
  console.error('⚠️  multer not installed — run: npm install');
}

module.exports = { uploadPhoto };
