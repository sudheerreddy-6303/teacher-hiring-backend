'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/teacherController');

// Teacher-specific profile
router.get ('/profile',       auth(['teacher']), c.getProfile);
router.patch('/profile',      auth(['teacher']), c.updateProfile);
router.post('/upload-photo',  auth(['teacher']), c.uploadPhotoHandler);

// General profile (all roles)
router.get ('/general-profile',  auth(), c.getGeneralProfile);
router.patch('/general-profile', auth(), c.updateGeneralProfile);

module.exports = router;
