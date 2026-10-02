'use strict';
// ─── AcadHr Banner Routes ─────────────────────────────────────────────────────
// NEW FILE. Public read + admin manage. Nothing existing is changed.
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/bannerController');

// Public: active banners for a placement (?placement=home | browse_teachers | ...)
router.get('/', c.listPublic);

// Admin: manage banners
router.get('/all',     auth(['admin']), c.listAll);
router.post('/save',   auth(['admin']), c.save);
router.post('/delete', auth(['admin']), c.remove);

module.exports = router;
