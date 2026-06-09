'use strict';
const path = require('path');
const fs   = require('fs');

const photoDir  = path.join(__dirname, '..', 'uploads', 'photos');
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
[photoDir, resumeDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

let uploadPhoto  = (req, res, next) => res.status(503).json({ message: 'Run: npm install' });
let uploadResume = (req, res, next) => res.status(503).json({ message: 'Run: npm install' });
let uploadPhotoMem  = (req, res, next) => res.status(503).json({ message: 'Run: npm install' });
let uploadResumeMem = (req, res, next) => res.status(503).json({ message: 'Run: npm install' });

try {
  const multer = require('multer');

  // Photo storage
  uploadPhoto = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, photoDir),
      filename:    (req, file, cb) => cb(null, `teacher_${req.user?.id || Date.now()}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits:     { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
      /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)
        ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP images allowed')),
  }).single('photo');

  // Resume storage
  uploadResume = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, resumeDir),
      filename:    (req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
        cb(null, `resume_${req.user?.id || Date.now()}_${name}${ext}`);
      },
    }),
    limits:     { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowed = /\.(pdf|doc|docx)$/.test(file.originalname.toLowerCase()) ||
                      /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/.test(file.mimetype);
      allowed ? cb(null, true) : cb(new Error('Only PDF/DOC/DOCX files allowed'));
    },
  }).single('resume');

} catch (e) {
  console.error('⚠️  multer not installed — run: npm install');
}

// ── Memory-storage uploaders (file kept in RAM, then saved to the database) ──
// Used so uploaded photos/resumes survive deploys (disk uploads are wiped on redeploy).
try {
  const multer = require('multer');
  const memStorage = multer.memoryStorage();

  uploadPhotoMem = multer({
    storage:    memStorage,
    limits:     { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
      /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)
        ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP images allowed')),
  }).single('photo');

  uploadResumeMem = multer({
    storage:    memStorage,
    limits:     { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowed = /\.(pdf|doc|docx)$/.test(file.originalname.toLowerCase()) ||
                      /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/.test(file.mimetype);
      allowed ? cb(null, true) : cb(new Error('Only PDF/DOC/DOCX files allowed'));
    },
  }).single('resume');
} catch (e) {
  console.error('⚠️  multer not installed — DB uploads disabled');
}

module.exports = { uploadPhoto, uploadResume, uploadPhotoMem, uploadResumeMem };

