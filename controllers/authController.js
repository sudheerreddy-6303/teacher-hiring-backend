'use strict';
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { sendOtpEmail, OTP_EXPIRY_MINS } = require('../utils/email');
require('dotenv').config();

const JWT_SECRET   = process.env.JWT_SECRET   || 'acadhr_secret_2025';
const JWT_EXPIRES  = process.env.JWT_EXPIRES  || '7d';
const VALID_ROLES  = ['teacher', 'tutor', 'school', 'parent'];
const BCRYPT_ROUNDS = 12;

function generateOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }

// POST /api/auth/send-signup-otp
async function sendSignupOtp(req, res) {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ message: 'Email and name required.' });
    const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ message: 'Email already registered.' });
    const otp = generateOtp();
    const exp = new Date(Date.now() + OTP_EXPIRY_MINS * 60000);
    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'signup']);
    await db.query('INSERT INTO otps (email, otp, type, expires_at) VALUES (?,?,?,?)', [email, otp, 'signup', exp]);
    await sendOtpEmail(email, name, otp, 'signup');
    res.json({ message: 'OTP sent.' });
  } catch (err) { console.error('[sendSignupOtp]', err); res.status(500).json({ message: 'Error sending OTP: ' + err.message }); }
}

// POST /api/auth/signup
async function signup(req, res) {
  try {
    const { name, email, password, phone, city, role, otp,
            subject, experience, qualification, bio, hourly_rate, teaching_mode,
            institute_type, est_year, student_count, website,
            student_name, student_class, board, subject: parentSubject,
            location, mode, preferred_time, budget, tutor_gender_pref, experience_req, notes } = req.body;

    if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    if (!name || !email || !password || !otp) return res.status(400).json({ message: 'All fields required.' });
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    // Verify OTP
    const [[otpRow]] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND type = ? AND otp = ? AND expires_at > NOW()',
      [email, 'signup', otp]
    );
    if (!otpRow) return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, city, role, is_email_verified, is_active) VALUES (?,?,?,?,?,?,1,1)',
      [name, email, hash, phone || null, city || null, role]
    );
    const userId = result.insertId;

    if (role === 'teacher') {
      await db.query(
        'INSERT INTO teachers (user_id, subject, experience, qualification, bio) VALUES (?,?,?,?,?)',
        [userId, subject || null, experience || null, qualification || null, bio || null]
      );
    } else if (role === 'tutor') {
      await db.query(
        'INSERT INTO tutors (user_id, subject, experience, qualification, hourly_rate, teaching_mode) VALUES (?,?,?,?,?,?)',
        [userId, subject || null, experience || null, qualification || null, hourly_rate || null, teaching_mode || null]
      );
    } else if (role === 'school') {
      await db.query(
        'INSERT INTO schools (user_id, institute_name, institute_type, est_year, student_count, website) VALUES (?,?,?,?,?,?)',
        [userId, name, institute_type || null, est_year || null, student_count || null, website || null]
      );
    } else if (role === 'parent') {
      await db.query(
        `INSERT INTO parents (user_id, student_name, student_class, board, subject, location, mode,
           preferred_time, budget, tutor_gender_pref, experience_req, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, student_name || null, student_class || null, board || null,
         parentSubject || null, location || null, mode || null, preferred_time || null,
         budget || null, tutor_gender_pref || null, experience_req || null, notes || null]
      );
    }

    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'signup']);
    const token = jwt.sign({ id: userId, name, email, role, city: city || null }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ message: 'Account created.', token, user: { id: userId, name, email, role, city } });
  } catch (err) {
    console.error('[signup]', err);
    res.status(500).json({ message: 'Server error during signup: ' + err.message });
  }
}

// POST /api/auth/send-login-otp
async function sendLoginOtp(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
    const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });
    const otp = generateOtp();
    const exp = new Date(Date.now() + OTP_EXPIRY_MINS * 60000);
    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'login']);
    await db.query('INSERT INTO otps (email, otp, type, expires_at) VALUES (?,?,?,?)', [email, otp, 'login', exp]);
    try {
      await sendOtpEmail(email, user.name, otp, 'login');
    } catch (mailErr) {
      console.error('[sendLoginOtp] email:', mailErr.message);
      // Still allow login when SMTP fails — OTP logged on server
    }
    const { EMAIL_CONFIGURED } = require('../config/mailer');
    res.json({
      message: EMAIL_CONFIGURED ? 'OTP sent to email.' : 'OTP generated (check server logs if email not configured).',
      dev: !EMAIL_CONFIGURED,
    });
  } catch (err) { console.error('[sendLoginOtp]', err); res.status(500).json({ message: 'Error: ' + err.message }); }
}

// POST /api/auth/verify-login-otp
async function verifyLoginOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const [[otpRow]] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND type = ? AND otp = ? AND expires_at > NOW()',
      [email, 'login', otp]
    );
    if (!otpRow) return res.status(400).json({ message: 'Invalid or expired OTP.' });
    const [[user]] = await db.query('SELECT id,name,email,role,city,phone,is_active FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'login']);
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, city: user.city }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, city: user.city, phone: user.phone } });
  } catch (err) { console.error('[verifyLoginOtp]', err); res.status(500).json({ message: 'Error: ' + err.message }); }
}

// POST /api/auth/resend-otp
async function resendOtp(req, res) {
  try {
    const { email, type } = req.body;
    const [[user]] = await db.query('SELECT name FROM users WHERE email = ?', [email]);
    const name = user?.name || 'User';
    const otp = generateOtp();
    const exp = new Date(Date.now() + OTP_EXPIRY_MINS * 60000);
    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, type]);
    await db.query('INSERT INTO otps (email, otp, type, expires_at) VALUES (?,?,?,?)', [email, otp, type, exp]);
    await sendOtpEmail(email, name, otp, type);
    res.json({ message: 'OTP resent.' });
  } catch (err) { res.status(500).json({ message: 'Error resending OTP.' }); }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const [[user]] = await db.query('SELECT id,name,email,role,city,phone,is_active FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    let profile = {};
    if (user.role === 'teacher') { const [r] = await db.query('SELECT * FROM teachers WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    else if (user.role === 'tutor')  { const [r] = await db.query('SELECT * FROM tutors  WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    else if (user.role === 'school') { const [r] = await db.query('SELECT * FROM schools  WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    else if (user.role === 'parent') { const [r] = await db.query('SELECT * FROM parents  WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    res.json({ user, profile });
  } catch (err) { res.status(500).json({ message: 'Error fetching user.' }); }
}

module.exports = { sendSignupOtp, signup, sendLoginOtp, verifyLoginOtp, resendOtp, me };
