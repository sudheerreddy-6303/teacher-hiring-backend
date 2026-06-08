'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/adminController');

// ── Public routes (no auth needed) ───────────────────────────────────────────
router.get ('/public/teachers',  c.getTeachers);
router.get ('/public/tutors',    c.getTutors);
router.get ('/public/tuitions',  c.getTuitions);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.get ('/stats',           auth(['admin']),  c.getStats);
router.get ('/users',           auth(['admin']),  c.getAllUsers);
router.get ('/teachers',        auth(['admin']),  c.getTeachers);
router.get ('/tutors',          auth(['admin']),  c.getTutors);
router.get ('/schools',         auth(['admin']),  c.getSchools);
router.get ('/parents',         auth(['admin']),  c.getParents);
router.get ('/all-jobs',        auth(['admin']),  c.getAllJobs);
router.get ('/pending-jobs',    auth(['admin']),  c.getPendingJobs);
router.get ('/analytics',       auth(['admin']),  c.getAnalytics);
router.patch('/jobs/:id',       auth(['admin']),  c.updateJob);
router.patch('/users/:id/toggle', auth(['admin']), c.toggleUser);

// Tutors list for parents (approved parents only)
router.get ('/tutors-list',     auth(['parent']), c.getTutorsForParent);

module.exports = router;
