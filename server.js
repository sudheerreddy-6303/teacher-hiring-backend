'use strict';
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const db           = require('./config/db');
const { mailer, EMAIL_CONFIGURED } = require('./config/mailer');

const authRoutes    = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const jobRoutes     = require('./routes/jobRoutes');
const adminRoutes   = require('./routes/adminRoutes');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true); // dev: allow all
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/^https?:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
    if (origin.includes('railway.app') || origin.includes('up.railway.app')) return cb(null, true);
    cb(null, true); // allow all in production for now
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Backward-compatible profile routes ───────────────────────────────────────
const auth = require('./middleware/auth');
const tc   = require('./controllers/teacherController');
app.get ('/api/profile', auth(), tc.getGeneralProfile);
app.patch('/api/profile', auth(), tc.updateGeneralProfile);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/jobs',    jobRoutes);
app.use('/api',         jobRoutes);
app.use('/api/admin',   adminRoutes);

// Tutors for parents
const adminCtrl = require('./controllers/adminController');
app.get('/api/tutors', auth(['parent']), adminCtrl.getTutorsForParent);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `${req.method} ${req.path} not found.` }));
app.use((err, req, res, _next) => {
  console.error('[Unhandled]', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// ── Startup + DB migrations ───────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, async () => {
  console.log(`\n🚀  AcadHr API  →  http://localhost:${PORT}`);

  try { await db.query('SELECT 1'); console.log('✅  MySQL connected'); }
  catch (err) { console.error('❌  MySQL failed:', err.message); return; }

  const addCol = async (table, col, def) => {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [table, col]
    );
    if (!rows.length) {
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
      console.log(`  + ${table}.${col}`);
    }
  };

  try { await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('teacher','tutor','school','admin','parent') NOT NULL`); } catch {}

  // ── Create/update admin account ──────────────────────────────────────────
  try {
    const bcrypt = require('bcryptjs');
    const ADMIN_EMAIL = 'acadhire01@gmail.com';
    const ADMIN_PASS  = 'acadhire@2026';
    const ADMIN_NAME  = 'AcadHr Admin';

    const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
    if (existing) {
      // Update password and ensure role is admin
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      await db.query(
        'UPDATE users SET password = ?, role = ?, is_email_verified = 1, is_active = 1 WHERE email = ?',
        [hash, 'admin', ADMIN_EMAIL]
      );
      console.log('✅  Admin account updated:', ADMIN_EMAIL);
    } else {
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      await db.query(
        'INSERT INTO users (name, email, password, role, is_email_verified, is_active) VALUES (?, ?, ?, ?, 1, 1)',
        [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin']
      );
      console.log('✅  Admin account created:', ADMIN_EMAIL);
    }
  } catch (err) { console.error('⚠️  Admin setup:', err.message); }
  try {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='otps'`
    );
    const colNames = cols.map(c => c.COLUMN_NAME);
    if (!colNames.includes('otp')) {
      // Table has wrong schema — drop and recreate
      await db.query('DROP TABLE IF EXISTS otps');
      await db.query(`
        CREATE TABLE otps (
          id         INT AUTO_INCREMENT PRIMARY KEY,
          email      VARCHAR(255) NOT NULL,
          otp        VARCHAR(10)  NOT NULL,
          type       VARCHAR(20)  NOT NULL,
          expires_at DATETIME     NOT NULL,
          created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_email_type (email, type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅  otps table fixed (recreated with correct columns)');
    } else {
      console.log('✅  otps table OK');
    }
  } catch (err) { console.error('⚠️  otps migration:', err.message); }

  try {
    await db.query(`CREATE TABLE IF NOT EXISTS req_id_sequence (id INT AUTO_INCREMENT PRIMARY KEY, year SMALLINT NOT NULL, seq INT NOT NULL DEFAULT 0, UNIQUE KEY uq_year (year)) ENGINE=InnoDB`);
    console.log('✅  req_id_sequence ready');
  } catch (err) { console.error('⚠️  req_id_sequence:', err.message); }

  try {
    for (const [col, def] of [
      ['requirement_id','VARCHAR(30) UNIQUE'],['institution_name','VARCHAR(200)'],
      ['institution_type','VARCHAR(100)'],['location_state','VARCHAR(100)'],
      ['location_city','VARCHAR(100)'],['contact_person','VARCHAR(150)'],
      ['contact_number','VARCHAR(20)'],['contact_email','VARCHAR(255)'],
      ["requirement_type","VARCHAR(50) DEFAULT 'Teacher'"],['grades','VARCHAR(300)'],
      ['board','VARCHAR(100)'],["joining_timeline","VARCHAR(50) DEFAULT 'Immediate'"],
      ["work_mode","VARCHAR(50) DEFAULT 'Full-time'"],["residential","VARCHAR(10) DEFAULT 'No'"],
      ["accommodation","VARCHAR(50) DEFAULT 'Not Provided'"],
      ["gender_preference","VARCHAR(50) DEFAULT 'No Preference'"],
      ["interview_mode","VARCHAR(50) DEFAULT 'Online'"],["demo_required","VARCHAR(10) DEFAULT 'No'"],
      ['positions','INT DEFAULT 1'],['notes','TEXT'],['assigned_recruiter','VARCHAR(150)'],
    ]) await addCol('jobs', col, def);
    console.log('✅  Jobs table ready');
  } catch (err) { console.error('⚠️  Jobs migration:', err.message); }

  try {
    for (const [col, def] of [
      ['full_name','VARCHAR(150)'],['mobile','VARCHAR(20)'],['gender','VARCHAR(20)'],
      ['dob','DATE'],['current_location','VARCHAR(150)'],['preferred_locations','VARCHAR(500)'],
      ['specialization','VARCHAR(100)'],['total_experience','VARCHAR(50)'],
      ['relevant_experience','VARCHAR(50)'],['current_role','VARCHAR(50)'],
      ['current_org','VARCHAR(200)'],['current_salary','VARCHAR(50)'],
      ['expected_salary','VARCHAR(50)'],['notice_period','VARCHAR(30)'],
      ['available_from','DATE'],['certifications','VARCHAR(300)'],
      ['work_mode','VARCHAR(50)'],['tutor_type','VARCHAR(50)'],['subjects','TEXT'],
      ['grades_handling','VARCHAR(300)'],['boards_handled','VARCHAR(300)'],
      ['competitive_exams','VARCHAR(300)'],['teaching_mode','VARCHAR(50)'],
      ['languages','VARCHAR(300)'],['demo_available','VARCHAR(10)'],
      ['demo_link','VARCHAR(500)'],['residential_pref','VARCHAR(10)'],
      ['relocation_ready','VARCHAR(10)'],['accommodation_req','VARCHAR(10)'],
      ['aadhaar_verified','VARCHAR(10)'],['resume_link','VARCHAR(500)'],
      ['resume_file_name','VARCHAR(300)'],["profile_status","VARCHAR(20) DEFAULT 'Active'"],
      ['remarks','TEXT'],['completion_pct','INT DEFAULT 0'],['profile_photo','VARCHAR(500)'],
    ]) await addCol('teachers', col, def);
    console.log('✅  Teachers table ready');
  } catch (err) { console.error('⚠️  Teachers migration:', err.message); }

  // Applications table
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        job_id      INT NOT NULL,
        teacher_id  INT NOT NULL,
        cover_note  TEXT,
        cover_letter TEXT,
        status      VARCHAR(20) DEFAULT 'pending',
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_application (job_id, teacher_id),
        FOREIGN KEY (job_id)     REFERENCES jobs(id)  ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    // Add cover_note column if missing (for existing tables that have cover_letter)
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='applications'`
    );
    const colNames = cols.map(c => c.COLUMN_NAME);
    if (!colNames.includes('cover_note')) {
      await db.query('ALTER TABLE applications ADD COLUMN cover_note TEXT');
      console.log('✅  applications.cover_note added');
    }
    console.log('✅  Applications table ready');
  } catch (err) { console.error('⚠️  Applications table:', err.message); }

  try {
    await db.query(`CREATE TABLE IF NOT EXISTS parents (
      user_id INT NOT NULL UNIQUE,
      student_name VARCHAR(150), student_class VARCHAR(50), board VARCHAR(50),
      subject VARCHAR(300), location VARCHAR(150), mode VARCHAR(50),
      preferred_time VARCHAR(50), budget VARCHAR(50), tutor_gender_pref VARCHAR(30),
      experience_req VARCHAR(50), status VARCHAR(20) DEFAULT 'Open',
      assigned_tutor VARCHAR(150), notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('✅  Parents table ready');
  } catch (err) { console.error('⚠️  Parents:', err.message); }

  if (EMAIL_CONFIGURED) {
    console.log(`📧  Email: SMTP ready (${process.env.EMAIL_USER})`);
    mailer.verify().catch(e => console.error('⚠️  SMTP:', e.message));
  } else {
    console.log('📧  Email: not configured — OTPs print to console');
  }
  console.log('');
});
