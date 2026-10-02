'use strict';
// ─── Parent tuition-posts routes (ADDED — new file, nothing replaced) ─────────
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/parentTuitionController');

router.get   ('/',     auth(['parent']), c.listMyTuitions);
router.post  ('/',     auth(['parent']), c.createMyTuition);
router.patch ('/:id',  auth(['parent']), c.updateMyTuition);
router.delete('/:id',  auth(['parent']), c.deleteMyTuition);

module.exports = router;
