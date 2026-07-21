'use strict';
// ── Tutor routes (ADDED — new file, nothing replaced) ────────────────────────
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/tutorController');

router.get ('/tuitions',                 auth(['tutor']), c.listTuitions);
router.get ('/tuition-applications',     auth(['tutor']), c.myTuitionApplications);
router.post('/tuitions/:parentId/apply', auth(['tutor']), c.applyTuition);

module.exports = router;
