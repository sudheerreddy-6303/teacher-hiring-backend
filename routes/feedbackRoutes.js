'use strict';
const router = require('express').Router();
const path   = require('path');
const fs     = require('fs');
const auth   = require('../middleware/auth');
const c      = require('../controllers/feedbackController');

const feedbackDir = path.join(__dirname, '..', 'uploads', 'feedback');
if (!fs.existsSync(feedbackDir)) fs.mkdirSync(feedbackDir, { recursive: true });

// Screenshot upload (optional). Falls back to no-op if multer isn't installed.
let uploadShot = (req, res, next) => next();
try {
  const multer = require('multer');
  uploadShot = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, feedbackDir),
      filename:    (req, file, cb) => {
        const ext = (path.extname(file.originalname) || '.png').toLowerCase();
        cb(null, `feedback_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
      },
    }),
    limits:     { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) =>
      /^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)
        ? cb(null, true) : cb(new Error('Only image screenshots allowed')),
  }).single('screenshot');
} catch (e) {
  console.error('\u26A0\uFE0F  multer not installed — feedback screenshots disabled');
}

// Wrap upload so a screenshot problem never blocks saving the text feedback
function optionalShot(req, res, next) {
  uploadShot(req, res, (err) => {
    if (err) req.fileError = err.message; // ignore and continue without the image
    next();
  });
}

// Public: submit feedback / error report (with optional screenshot)
router.post('/', optionalShot, c.createFeedback);

// Admin: list all submitted feedback
router.get('/', auth(['admin']), c.listFeedback);

module.exports = router;
