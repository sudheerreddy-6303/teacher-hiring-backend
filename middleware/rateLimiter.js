'use strict';
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  { message: 'Too many OTP requests. Please wait 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { message: 'Too many requests. Please wait 15 minutes.' },
});

module.exports = { otpLimiter, authLimiter };
