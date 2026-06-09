'use strict';
const router = require('express').Router();
const c      = require('../controllers/fileController');

// Served under /uploads (mounted after express.static, so disk files win if present,
// otherwise the file is streamed from the database).
router.get('/photos/:filename',  c.serveByFilename);
router.get('/resumes/:filename', c.serveByFilename);

module.exports = router;
