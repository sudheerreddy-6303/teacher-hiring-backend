'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/teacherController');

router.get ('/profile',          auth(['teacher']), c.getProfile);
router.patch('/profile',         auth(['teacher']), c.updateProfile);
router.post('/upload-photo',     auth(['teacher']), c.uploadPhotoHandler);
router.post('/upload-resume',    auth(['teacher']), c.uploadResumeHandler);

router.get ('/general-profile',  auth(), c.getGeneralProfile);
router.patch('/general-profile', auth(), c.updateGeneralProfile);

module.exports = router;
