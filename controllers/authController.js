'use strict';
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { sendOtpEmail, OTP_EXPIRY_MINS } = require('../utils/email');
const { saveBlob } = require('./fileController');
require('dotenv').config();

const JWT_SECRET   = process.env.JWT_SECRET   || 'acadhr_secret_2025';
const JWT_EXPIRES  = process.env.JWT_EXPIRES  || '7d';
const VALID_ROLES  = ['teacher', 'tutor', 'school', 'parent'];
const BCRYPT_ROUNDS = 12;

// Make sure the extra tutor columns exist (runs once, lazily, on first tutor signup).
// This guarantees tutor data saves even if the server.js startup migration didn't run.
let _tutorColsReady = false;
async function ensureTutorColumns() {
  if (_tutorColsReady) return;
  const cols = [
    ['subjects', 'TEXT'], ['qualifications', 'TEXT'],
    ['address', 'VARCHAR(300)'], ['location', 'VARCHAR(200)'], ['pincode', 'VARCHAR(20)'],
    ['availability', 'VARCHAR(200)'], ['class_link', 'VARCHAR(500)'],
    ['resume_link', 'VARCHAR(500)'], ['resume_file_name', 'VARCHAR(300)'],
    ['gender', 'VARCHAR(20)'],
    // ADDED: tutor photo, classes taught (max 3), state & country
    ['photo_link', 'VARCHAR(500)'], ['photo_file_name', 'VARCHAR(300)'],
    ['classes_taught', 'VARCHAR(300)'], ['state', 'VARCHAR(100)'], ['country', 'VARCHAR(100)'],
    // ADDED: courses dropdown, demo class link (YouTube/Instagram), about yourself (~300 words)
    ['tutor_courses', 'VARCHAR(255)'], ['demo_class_link', 'VARCHAR(500)'], ['about_yourself', 'TEXT'],
    // ADDED: tutor terms & conditions acceptance flag
    ['terms_accepted', 'TINYINT(1)'],
    // ADDED: admin approval gate for public visibility (Pending until admin approves)
    ['profile_status', 'VARCHAR(30)'],
  ];
  for (const [col, def] of cols) {
    try {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tutors' AND COLUMN_NAME=?`,
        [col]
      );
      if (!rows.length) await db.query(`ALTER TABLE tutors ADD COLUMN \`${col}\` ${def}`);
    } catch (e) { /* ignore individual column errors */ }
  }
  try { await db.query('ALTER TABLE tutors MODIFY COLUMN subject VARCHAR(255)'); } catch {}
  try { await db.query('ALTER TABLE tutors MODIFY COLUMN qualification VARCHAR(255)'); } catch {}
  _tutorColsReady = true;
}

// Make sure the extra parent columns exist (runs once, lazily, on first parent signup).
let _parentColsReady = false;
async function ensureParentColumns() {
  if (_parentColsReady) return;
  const cols = [
    ['pincode', 'VARCHAR(20)'], ['state', 'VARCHAR(100)'], ['landmark', 'VARCHAR(300)'],
    ['hourly_budget', 'VARCHAR(50)'], ['institute_name', 'VARCHAR(300)'],
    ['courses', 'VARCHAR(255)'], ['preferred_days', 'VARCHAR(255)'],
  ];
  for (const [col, def] of cols) {
    try {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='parents' AND COLUMN_NAME=?`,
        [col]
      );
      if (!rows.length) await db.query(`ALTER TABLE parents ADD COLUMN \`${col}\` ${def}`);
    } catch (e) { /* ignore individual column errors */ }
  }
  try { await db.query('ALTER TABLE parents MODIFY COLUMN subject VARCHAR(255)'); } catch {}
  try { await db.query('ALTER TABLE parents MODIFY COLUMN preferred_time VARCHAR(255)'); } catch {}
  _parentColsReady = true;
}

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
      // ADDED (per request): every NEW teacher registration gets 10 free credits (1 credit = 1 job application).
      // Wrapped in try/catch so a credits problem can never block the signup itself.
      try {
        const FREE_TEACHER_CREDITS = 10;
        try {
          await db.query('UPDATE users SET credits = COALESCE(credits,0) + ? WHERE id = ?', [FREE_TEACHER_CREDITS, userId]);
        } catch (eCol) {
          // credits column not created yet on this database → create it, then add the free credits
          await db.query('ALTER TABLE users ADD COLUMN `credits` INT DEFAULT 0');
          await db.query('UPDATE users SET credits = COALESCE(credits,0) + ? WHERE id = ?', [FREE_TEACHER_CREDITS, userId]);
        }
      } catch (eCr) { console.error('[signup] free teacher credits not added:', eCr.message); }
      // ADDED: teacher registration now sends the SAME profile fields as Admin → Add Teacher
      // (req.body.tp). Save them into the same columns My Profile / Add Teacher use.
      // Wrapped in try/catch so a profile-column problem can never block the signup itself.
      try {
        const tp = (req.body && typeof req.body.tp === 'object' && req.body.tp) || {};
        const tpFields = [
          'gender','dob','preferred_locations','qualification','specialization','total_experience','relevant_experience',
          'current_role','current_org','current_salary','expected_salary','notice_period','available_from','certifications',
          'work_mode','tutor_type','subjects','grades_handling','boards_handled','competitive_exams','teaching_mode','languages',
          'demo_available','demo_link','residential_pref','relocation_ready','accommodation_req','aadhaar_verified',
          'resume_link','resume_file_name','profile_status','remarks','terms_accepted',
        ];
        const clean = (f, v) => {
          if (v === undefined || v === null || v === '') return null;
          if ((f === 'dob' || f === 'available_from') && typeof v === 'string' && v.includes('T')) return v.split('T')[0];
          return v;
        };
        const vals = {
          full_name: name, mobile: phone || null, current_location: city || null,
          ...Object.fromEntries(tpFields.map(f => [f, clean(f, tp[f])])),
        };
        if (!vals.profile_status) vals.profile_status = 'Active';
        // ADDED: State & Country from registration Step 1
        vals.state   = req.body.state   || null;
        vals.country = req.body.country || null;
        if (Object.keys(tp).length) {
          const keys = Object.keys(vals);
          await db.query(
            `UPDATE teachers SET ${keys.map(k => `\`${k}\` = ?`).join(', ')} WHERE user_id = ?`,
            [...keys.map(k => vals[k]), userId]
          );
        }
      } catch (e) {
        console.error('[signup] teacher profile fields not saved together:', e.message);
        // ADDED: fall back to saving each detail on its own, so one rejected value can't lose all the others
        try {
          const tp2 = (req.body && typeof req.body.tp === 'object' && req.body.tp) || {};
          const one = { full_name: name, mobile: phone || null, current_location: city || null,
                        state: req.body.state || null, country: req.body.country || null, profile_status: tp2.profile_status || 'Active' };
          for (const [k, v] of Object.entries(tp2)) if (!k.startsWith('_') && v !== '' && v != null) one[k] = (k === 'dob' || k === 'available_from') && String(v).includes('T') ? String(v).split('T')[0] : v;
          for (const [k, v] of Object.entries(one)) {
            const ALLOWED = ['full_name','mobile','current_location','state','country','gender','dob','preferred_locations','qualification',
              'specialization','total_experience','relevant_experience','current_role','current_org','current_salary','expected_salary',
              'notice_period','available_from','certifications','work_mode','tutor_type','subjects','grades_handling','boards_handled',
              'competitive_exams','teaching_mode','languages','demo_available','demo_link','residential_pref','relocation_ready',
              'accommodation_req','aadhaar_verified','resume_link','resume_file_name','profile_status','remarks','terms_accepted'];
            if (!ALLOWED.includes(k)) continue; // only known profile columns
            try { await db.query(`UPDATE teachers SET \`${k}\` = ? WHERE user_id = ?`, [v, userId]); }
            catch (e2) { console.error(`[signup] teacher field ${k} not saved:`, e2.message); }
          }
        } catch (e3) { console.error('[signup] per-field save failed:', e3.message); }
      }
    } else if (role === 'tutor') {
      // Extra tutor fields (multi-selects arrive as arrays; resume as base64)
      const { subjects, qualifications, availability, address, tutor_location,
              pincode, class_link, resume_base64, resume_name, resume_type, gender } = req.body;
      // ADDED: new tutor signup fields — photo, classes taught, state, country
      const { tutor_photo_base64, tutor_photo_name, tutor_photo_type, classes_taught, state, country } = req.body;
      // ADDED: courses dropdown, demo class link, about-yourself (~300 words)
      const { tutor_courses, demo_class_link, about_yourself } = req.body;
      // ADDED: tutor terms & conditions acceptance
      const { tutor_terms_accepted } = req.body;
      const join = v => Array.isArray(v) ? v.filter(Boolean).join(', ') : (v || '');
      const subjectStr       = join(subjects)       || subject       || null;
      const qualificationStr = join(qualifications) || qualification || null;
      const availabilityStr  = join(availability)   || null;
      // ADDED: classes can arrive as array or comma string; cap at 3
      const classesStr = join(classes_taught).split(',').map(s => s.trim()).filter(Boolean).slice(0, 3).join(', ') || null;

      // Optional resume upload → store bytes in file_blobs, keep a link on the tutor row
      let resumeLink = null, resumeFileName = null;
      if (resume_base64) {
        try {
          const buf  = Buffer.from(String(resume_base64).replace(/^data:[^;]+;base64,/, ''), 'base64');
          const safe = (resume_name || 'resume').replace(/[^a-zA-Z0-9._-]/g, '_');
          const fname = `tutor_${userId}_${Date.now()}_${safe}`;
          await saveBlob(userId, 'resume', fname, resume_type || 'application/octet-stream', buf);
          resumeFileName = resume_name || safe;
          resumeLink = `/uploads/resumes/${fname}`;
        } catch (e) { console.error('[signup tutor resume]', e.message); }
      }

      // ADDED: optional tutor photo upload → store bytes in file_blobs, keep a link on the tutor row
      let photoLink = null, photoFileName = null;
      if (tutor_photo_base64) {
        try {
          const pbuf  = Buffer.from(String(tutor_photo_base64).replace(/^data:[^;]+;base64,/, ''), 'base64');
          const psafe = (tutor_photo_name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
          const pfname = `tutorphoto_${userId}_${Date.now()}_${psafe}`;
          await saveBlob(userId, 'photo', pfname, tutor_photo_type || 'image/jpeg', pbuf);
          photoFileName = tutor_photo_name || psafe;
          photoLink = `/uploads/photos/${pfname}`;
        } catch (e) { console.error('[signup tutor photo]', e.message); }
      }

      // Rich insert (new columns); fall back to the original columns if a column is missing
      await ensureTutorColumns();
      try {
        await db.query(
          `INSERT INTO tutors (user_id, subject, subjects, experience, qualification, qualifications,
             hourly_rate, teaching_mode, bio, address, location, pincode, availability, class_link,
             resume_link, resume_file_name, gender,
             photo_link, photo_file_name, classes_taught, state, country,
             tutor_courses, demo_class_link, about_yourself, terms_accepted, profile_status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [userId, subjectStr, join(subjects)||null, experience||null, qualificationStr, join(qualifications)||null,
           hourly_rate||null, teaching_mode||null, bio||null, address||null, tutor_location||null, pincode||null,
           availabilityStr, class_link||null, resumeLink, resumeFileName, gender||null,
           photoLink, photoFileName, classesStr, state||null, country||null,
           join(tutor_courses)||null, demo_class_link||null, about_yourself||null, (tutor_terms_accepted ? 1 : 0), 'Pending']
        );
      } catch (e) {
        console.error('[signup tutor] rich insert failed, using fallback:', e.message);
        await db.query(
          'INSERT INTO tutors (user_id, subject, experience, qualification, hourly_rate, teaching_mode, bio) VALUES (?,?,?,?,?,?,?)',
          [userId, subjectStr, experience||null, qualificationStr, hourly_rate||null, teaching_mode||null, bio||null]
        );
      }
    } else if (role === 'school') {
      await db.query(
        'INSERT INTO schools (user_id, institute_name, institute_type, est_year, student_count, website) VALUES (?,?,?,?,?,?)',
        [userId, name, institute_type || null, est_year || null, student_count || null, website || null]
      );
      // ADDED: also store the state (and city) at signup so "Post a Job" can auto-fill them.
      const { state: schoolState } = req.body;
      for (const [col, def, val] of [['state', 'VARCHAR(100)', schoolState], ['city', 'VARCHAR(100)', city]]) {
        try {
          const [c] = await db.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='schools' AND COLUMN_NAME=?",
            [col]
          );
          if (!c.length) await db.query(`ALTER TABLE schools ADD COLUMN \`${col}\` ${def}`);
          if (val) await db.query(`UPDATE schools SET \`${col}\`=? WHERE user_id=?`, [val, userId]);
        } catch (e) { /* non-fatal */ }
      }
    } else if (role === 'parent') {
      const { parent_pincode, parent_state, parent_landmark, hourly_budget, institute_name } = req.body;
      const { courses, preferred_days } = req.body;
      await ensureParentColumns();
      try {
        await db.query(
          `INSERT INTO parents (user_id, student_name, student_class, board, subject, location, mode,
             preferred_time, budget, tutor_gender_pref, experience_req, notes,
             pincode, state, landmark, hourly_budget, institute_name, courses, preferred_days)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [userId, student_name || null, student_class || null, board || null,
           parentSubject || null, location || null, mode || null, preferred_time || null,
           budget || null, tutor_gender_pref || null, experience_req || null, notes || null,
           parent_pincode || null, parent_state || null, parent_landmark || null,
           hourly_budget || null, institute_name || null, courses || null, preferred_days || null]
        );
      } catch (e) {
        console.error('[signup parent] rich insert failed, using fallback:', e.message);
        await db.query(
          `INSERT INTO parents (user_id, student_name, student_class, board, subject, location, mode,
             preferred_time, budget, tutor_gender_pref, experience_req, notes)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [userId, student_name || null, student_class || null, board || null,
           parentSubject || null, location || null, mode || null, preferred_time || null,
           budget || null, tutor_gender_pref || null, experience_req || null, notes || null]
        );
      }
    }

    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'signup']);
    const token = jwt.sign({ id: userId, name, email, role, city: city || null }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ message: 'Account created.', token, user: { id: userId, name, email, role, city, subject: subject || null } });
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
    // Look up the subject from the role-specific table so the dashboard can show it
    let subject = null;
    if (user.role === 'teacher')      { const [[r]] = await db.query('SELECT subject FROM teachers WHERE user_id = ?', [user.id]); subject = r?.subject || null; }
    else if (user.role === 'tutor')   { const [[r]] = await db.query('SELECT subject FROM tutors  WHERE user_id = ?', [user.id]); subject = r?.subject || null; }
    else if (user.role === 'parent')  { const [[r]] = await db.query('SELECT subject FROM parents WHERE user_id = ?', [user.id]); subject = r?.subject || null; }
    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'login']);
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, city: user.city }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, city: user.city, phone: user.phone, subject } });
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

// POST /api/auth/send-forgot-otp
async function sendForgotOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const [[user]] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });
    const otp = generateOtp();
    const exp = new Date(Date.now() + OTP_EXPIRY_MINS * 60000);
    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'reset']);
    await db.query('INSERT INTO otps (email, otp, type, expires_at) VALUES (?,?,?,?)', [email, otp, 'reset', exp]);
    try {
      await sendOtpEmail(email, user.name, otp, 'reset');
    } catch (mailErr) {
      console.error('[sendForgotOtp] email:', mailErr.message);
      // Still proceed when SMTP fails — OTP logged on server
    }
    const { EMAIL_CONFIGURED } = require('../config/mailer');
    res.json({
      message: EMAIL_CONFIGURED ? 'Password reset OTP sent to your email.' : 'OTP generated (check server logs if email not configured).',
      dev: !EMAIL_CONFIGURED,
    });
  } catch (err) { console.error('[sendForgotOtp]', err); res.status(500).json({ message: 'Error sending OTP: ' + err.message }); }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ message: 'Email, OTP and new password are required.' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const [[otpRow]] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND type = ? AND otp = ? AND expires_at > NOW()',
      [email, 'reset', otp]
    );
    if (!otpRow) return res.status(400).json({ message: 'Invalid or expired OTP.' });
    const [[user]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hash, email]);
    await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, 'reset']);
    res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
  } catch (err) { console.error('[resetPassword]', err); res.status(500).json({ message: 'Error: ' + err.message }); }
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

module.exports = { sendSignupOtp, signup, sendLoginOtp, verifyLoginOtp, resendOtp, sendForgotOtp, resetPassword, me };
