'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/adminController');

// ── Public routes (no auth needed) ───────────────────────────────────────────
// CHANGED (fix #1): public routes now use the safe functions (no email/phone/
// salary/DOB/remarks). Original lines kept below as comments for reference.
// router.get ('/public/teachers',  c.getTeachers);
// router.get ('/public/tutors',    c.getTutors);
// router.get ('/public/schools',   c.getSchools);
// router.get ('/public/parents',   c.getParents);
router.get ('/public/teachers',  c.getPublicTeachers);
router.get ('/public/tutors',    c.getPublicTutors);
router.get ('/public/tuitions',  c.getTuitions);
router.get ('/public/schools',   c.getPublicSchools);
router.get ('/public/parents',   c.getPublicParents);

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

// ── Admin: add new records ────────────────────────────────────────────────────
router.post('/teachers',        auth(['admin']),  c.createTeacher);
router.patch('/teachers/:id',   auth(['admin']),  c.updateTeacher);
router.post('/tutors',          auth(['admin']),  c.createTutor);
router.patch('/tutors/:id',     auth(['admin']),  c.updateTutor);
router.patch('/schools/:id',    auth(['admin']),  c.updateSchool);
router.patch('/parents/:id',    auth(['admin']),  c.updateParent);
router.post('/tuitions',        auth(['admin']),  c.createTuition);
router.post('/jobs',            auth(['admin']),  c.createAdminJob);

// Tutors list for parents (approved parents only)
router.get ('/tutors-list',     auth(['parent']), c.getTutorsForParent);

// ADDED: teacher database with contact info for logged-in schools (View Contact)
router.get ('/school/teachers', auth(['school']), c.getTeachersForSchool);

// ADDED: parent contact credits (5 free on signup; server-side balance)
router.get ('/parent/credits',    auth(['parent']), c.getParentCredits);
router.post('/parent/use-credit', auth(['parent']), c.useParentCredit);

module.exports = router;
