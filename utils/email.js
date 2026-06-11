'use strict';
const path                   = require('path');
const { mailer, EMAIL_CONFIGURED } = require('../config/mailer');

const COMPANY_NAME   = 'AcadHr';
const OTP_EXPIRY_MINS = 10;

async function sendOtpEmail(email, name, otp, type) {
  if (!EMAIL_CONFIGURED) {
    console.log('\n' + '═'.repeat(55));
    console.log(`📧  OTP for ${email} [${type}]`);
    console.log(`🔑  Code: ${otp}`);
    console.log(`⏱️   Expires in ${OTP_EXPIRY_MINS} minutes`);
    console.log('    (Add EMAIL_USER + EMAIL_PASS to .env for real emails)');
    console.log('═'.repeat(55) + '\n');
    return;
  }

  const subject = type === 'signup'
    ? `${otp} — Verify your ${COMPANY_NAME} account`
    : type === 'reset'
    ? `${otp} — Reset your ${COMPANY_NAME} password`
    : `${otp} — Your ${COMPANY_NAME} login code`;

  const action = type === 'signup'
    ? 'complete your registration'
    : type === 'reset'
    ? 'reset your password'
    : 'log in to your account';

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}
  .header{background:linear-gradient(135deg,#1E3A8A,#1A56DB);padding:32px 36px;text-align:center}
  .header img{height:56px;margin-bottom:10px}
  .body{padding:36px}
  .otp-box{background:#EBF5FF;border:2px dashed #1A56DB;border-radius:14px;padding:28px;text-align:center;margin:28px 0}
  .otp{font-size:48px;font-weight:900;letter-spacing:14px;color:#1A56DB;font-family:monospace}
  .expiry{font-size:13px;color:#6B7280;margin-top:10px}
  .footer{background:#F9FAFB;padding:22px 36px;text-align:center;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB}
</style></head><body>
<div class="wrap">
  <div class="header">
    <img src="cid:acadhr-logo" alt="${COMPANY_NAME}" />
    <p style="color:#93C5FD;font-size:13px;margin:0;letter-spacing:1px">CONNECT · HIRE · TRAIN · GROW</p>
  </div>
  <div class="body">
    <h2 style="color:#111827;margin-top:0">Hello, ${name}! 👋</h2>
    <p style="color:#6B7280;line-height:1.7">
      Use the verification code below to ${action}. This code expires in <strong>${OTP_EXPIRY_MINS} minutes</strong>.
    </p>
    <div class="otp-box">
      <div class="otp">${otp}</div>
      <div class="expiry">⏱ Valid for ${OTP_EXPIRY_MINS} minutes only</div>
    </div>
    <p style="color:#9CA3AF;font-size:13px;line-height:1.7">
      If you did not request this code, please ignore this email. Do not share this code with anyone.
    </p>
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} ${COMPANY_NAME} · All rights reserved<br/>
    <span style="color:#D1D5DB">This is an automated message — please do not reply.</span>
  </div>
</div></body></html>`;

  const fs = require('fs');
  const logoPath = path.join(__dirname, '..', 'acadhr-logo.png');
  const mailOpts = {
    from: process.env.EMAIL_FROM || `"${COMPANY_NAME}" <noreply@acadhr.com>`,
    to: email,
    subject,
    html,
  };
  if (fs.existsSync(logoPath)) {
    mailOpts.attachments = [{
      filename: 'acadhr-logo.png',
      path: logoPath,
      cid: 'acadhr-logo',
      contentType: 'image/png',
    }];
  }
  await mailer.sendMail(mailOpts);
}

module.exports = { sendOtpEmail, OTP_EXPIRY_MINS };
