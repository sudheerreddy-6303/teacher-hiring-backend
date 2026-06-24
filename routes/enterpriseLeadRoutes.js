'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/enterpriseLeadController');

// Public: submit an enterprise "Contact Sales" enquiry
router.post('/', c.createLead);

// Admin: list all submitted enterprise leads
router.get('/', auth(['admin']), c.listLeads);

module.exports = router;
