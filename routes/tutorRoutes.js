'use strict';
// ── Tutor routes (ADDED — new file, nothing replaced) ────────────────────────
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/tutorController');

router.get ('/tuitions',                 auth(['tutor']), c.listTuitions);
router.get ('/tuition-applications',     auth(['tutor']), c.myTuitionApplications);
router.post('/tuitions/:parentId/apply', auth(['tutor']), c.applyTuition);
// ADDED: a PARENT sees the tutors who applied to their requirement
router.get ('/my-tuition-applicants',    auth(['parent']), c.tuitionApplicants);

// ADDED: My Videos — tutor intro/demo videos (link or uploaded file)
router.get   ('/videos',      auth(['tutor']), c.listVideos);
router.post  ('/videos',      auth(['tutor']), c.addVideo);
router.delete('/videos/:id',  auth(['tutor']), c.deleteVideo);

module.exports = router;
