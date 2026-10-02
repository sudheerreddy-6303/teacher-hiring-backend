'use strict';
// ─── AcadHr Payment Routes ────────────────────────────────────────────────────
// NEW FILE. Same style as your other route files. Nothing existing is changed.
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/paymentController');

// Public: Razorpay key_id + plan list (no secrets)
router.get('/config', c.getConfig);

// Logged-in users: start a payment and verify it
router.post('/create-order', auth(), c.createOrder);
router.post('/verify',       auth(), c.verifyPayment);

// Logged-in user: own payment history
router.get('/mine', auth(), c.myPayments);

// Logged-in user: current credit balance
router.get('/credits', auth(), c.getCredits);

// Admin: all payments (for the Admin "Payments" tab)
router.get('/all', auth(['admin']), c.listPayments);

// Admin: manage the plans catalog (prices / credits / features / active)
router.get('/admin/plans',            auth(['admin']), c.adminListPlans);
router.post('/admin/plans/save-group', auth(['admin']), c.adminSaveGroup);

module.exports = router;
