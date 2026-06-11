'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/authController');
const { otpLimiter, authLimiter } = require('../middleware/rateLimiter');

router.post('/send-signup-otp',  otpLimiter,  c.sendSignupOtp);
router.post('/signup',           authLimiter, c.signup);
router.post('/send-login-otp',   otpLimiter,  c.sendLoginOtp);
router.post('/verify-login-otp', authLimiter, c.verifyLoginOtp);
router.post('/resend-otp',       otpLimiter,  c.resendOtp);
router.post('/send-forgot-otp',  otpLimiter,  c.sendForgotOtp);
router.post('/reset-password',   authLimiter, c.resetPassword);
router.get ('/me',               auth(),      c.me);

module.exports = router;
