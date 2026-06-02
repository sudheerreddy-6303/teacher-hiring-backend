'use strict';
const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_CONFIGURED = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const mailer = EMAIL_CONFIGURED
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

module.exports = { mailer, EMAIL_CONFIGURED };
