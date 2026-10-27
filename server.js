'use strict';
require('dotenv').config();

// ── ADDED (fix #12): crash guards — log unexpected errors instead of dying ───
process.on('unhandledRejection', (err) => console.error('❌ Unhandled rejection:', err));
process.on('uncaughtException',  (err) => console.error('❌ Uncaught exception:', err));
// ── END ADDED ─────────────────────────────────────────────────────────────────

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const db           = require('./config/db');
const { mailer, EMAIL_CONFIGURED } = require('./config/mailer');

const authRoutes    = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const jobRoutes     = require('./routes/jobRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const enterpriseLeadRoutes = require('./routes/enterpriseLeadRoutes');
const tutorRoutes   = require('./routes/tutorRoutes'); // ADDED: tutor tuitions database + apply
const paymentRoutes = require('./routes/paymentRoutes'); // ADDED: payments (Razorpay)
const bannerRoutes  = require('./routes/bannerRoutes'); // ADDED: admin-managed banners
const parentTuitionRoutes = require('./routes/parentTuitionRoutes'); // ADDED: parent multiple tuition posts

const app = express();

// Railway / Render sit behind a reverse proxy — required for rate-limit + req.ip
app.set('trust proxy', 1);

// ── CORS — allow all origins (Render + Railway + local) ──────────────────────
app.use(cors({
  origin: true,          // reflect request origin — allows all
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}));
app.options('*', cors()); // handle pre-flight for all routes

app.use(express.json({ limit: '25mb' })); // ADDED: raised from 10mb so tutor resume + photo (base64) both fit
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Fallback: serve uploaded files from the database when missing on disk (survives deploys)
app.use('/uploads', require('./routes/fileRoutes'));

// ── Backward-compatible profile routes ───────────────────────────────────────
const auth = require('./middleware/auth');
const tc   = require('./controllers/teacherController');
app.get ('/api/profile', auth(), tc.getGeneralProfile);
app.patch('/api/profile', auth(), tc.updateGeneralProfile);

// ── Root + health (must be BEFORE app.use('/api', jobRoutes)) ────────────────
async function healthHandler(req, res) {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date() });
  } catch (err) {
    // ── CHANGED (fix #11): report real failure (HTTP 500) so monitoring can detect DB outages ──
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.code || err.message, time: new Date() });
  }
}

app.get('/', (req, res) => {
  res.json({
    name: 'AcadHr API',
    status: 'running',
    health: '/api/health',
    docs: 'All routes are under /api — e.g. /api/auth/send-login-otp, /api/jobs',
  });
});

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/tutor',   tutorRoutes); // ADDED: tutor tuitions database + apply
app.use('/api/jobs',    jobRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/contact-sales', enterpriseLeadRoutes);
app.use('/api',         jobRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/payments', paymentRoutes); // ADDED: payments (Razorpay)
app.use('/api/banners',  bannerRoutes); // ADDED: admin-managed banners
app.use('/api/parent-tuitions', parentTuitionRoutes); // ADDED: parent multiple tuition posts

// Tutors for parents
const adminCtrl = require('./controllers/adminController');
app.get('/api/tutors', auth(['parent']), adminCtrl.getTutorsForParent);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `${req.method} ${req.path} not found.` }));
app.use((err, req, res, _next) => {
  console.error('[Unhandled]', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// ── Startup + DB migrations ───────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000;

// Start server FIRST — respond to health checks immediately
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀  AcadHr API running on port ${PORT}`);
  console.log(`   NODE_ENV : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DB_HOST  : ${process.env.DB_HOST || process.env.MYSQLHOST || 'localhost'}`);
  console.log(`   DB_NAME  : ${process.env.DB_NAME || process.env.MYSQLDATABASE || 'acadhr'}`);
  // Run DB setup async AFTER server is already listening
  setupDatabase().catch(e => console.error('⚠️ DB setup error:', e.message));
});

server.on('error', err => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

async function setupDatabase() {
  // Test DB connection
  try { 
    await db.query('SELECT 1'); 
    console.log('✅  MySQL connected');
  } catch (err) { 
    console.error('❌  MySQL connection failed:', err.message);
    console.error('   DB_HOST:', process.env.DB_HOST || process.env.MYSQLHOST || 'NOT SET');
    console.error('   DB_PORT:', process.env.DB_PORT || process.env.MYSQLPORT || 'NOT SET');
    console.error('   DB_USER:', process.env.DB_USER || process.env.MYSQLUSER || 'NOT SET');
    console.error('   DB_NAME:', process.env.DB_NAME || process.env.MYSQLDATABASE || 'NOT SET');
    return; // Exit setup but keep server running for health checks
  }

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

  // Widen jobs.requirement_type from the old ENUM('Teacher','Faculty','Tutor') to VARCHAR(50)
  // so non-teaching profiles (Principal, Vice Principal, Academic Counsellor, etc.) can be saved.
  // Non-destructive: existing values are preserved.
  try { await db.query(`ALTER TABLE jobs MODIFY COLUMN requirement_type VARCHAR(50) DEFAULT 'Teacher'`); } catch {}

  // ── Create/update admin account ──────────────────────────────────────────
  // CHANGED (fix #2): credentials now come from environment variables instead of
  // being hardcoded. Set ADMIN_EMAIL + ADMIN_PASSWORD in Railway → backend → Variables.
  // If they are not set, this step is safely skipped — all other logic unchanged.
  try {
    const bcrypt = require('bcryptjs');
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASS  = process.env.ADMIN_PASSWORD;
    const ADMIN_NAME  = process.env.ADMIN_NAME || 'AcadHr Admin';

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      console.log('ℹ️  Admin setup skipped — set ADMIN_EMAIL + ADMIN_PASSWORD env vars to enable.');
    } else {
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
    }
  } catch (err) { console.error('⚠️  Admin setup:', err.message); }

  // ── ONE-TIME: give ALL existing teachers 5 free credits and ALL parents 20 ──
  // Runs exactly ONCE (guarded by the app_migrations table). After it has run,
  // future restarts/deploys skip it — so nobody's spent credits ever get reset.
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS app_migrations (
      name VARCHAR(100) PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    const MIG = 'free_credits_teacher5_parent20_v1';
    const [[done]] = await db.query('SELECT name FROM app_migrations WHERE name = ?', [MIG]);
    if (!done) {
      try { await addCol('users',   'credits', 'INT DEFAULT 0');  } catch {}
      try { await addCol('parents', 'credits', 'INT DEFAULT 20'); } catch {}
      const [t] = await db.query("UPDATE users SET credits = 5 WHERE role = 'teacher'");
      const [p] = await db.query('UPDATE parents SET credits = 20');
      await db.query('INSERT INTO app_migrations (name) VALUES (?)', [MIG]);
      console.log(`✅  Free-credits migration applied: ${t.affectedRows} teachers → 5, ${p.affectedRows} parents → 20`);
    } else {
      console.log('ℹ️  Free-credits migration already applied — skipped.');
    }
  } catch (err) { console.error('⚠️  Free-credits migration:', err.message); }

  // ── DEMO ACCOUNTS (for testing every dashboard WITHOUT email OTP) ──────────
  // Only runs when SEED_DEMO=1 is set in the backend env (Railway → Variables).
  // Creates/refreshes one verified login per role, each with 25 credits so you
  // can test apply / post / contact freely. Safe to leave off in production.
  if (String(process.env.SEED_DEMO || '') === '1') {
    try {
      const bcrypt = require('bcryptjs');
      const DEMO_PASS = process.env.DEMO_PASSWORD || 'Demo@12345';
      const hash = await bcrypt.hash(DEMO_PASS, 10);
      const DEMO = [
        { name: 'Demo Teacher', email: 'teacher.demo@acadhr.com', role: 'teacher', city: 'Hyderabad' },
        { name: 'Demo Tutor',   email: 'tutor.demo@acadhr.com',   role: 'tutor',   city: 'Hyderabad' },
        { name: 'Demo School',  email: 'school.demo@acadhr.com',  role: 'school',  city: 'Hyderabad' },
        { name: 'Demo Parent',  email: 'parent.demo@acadhr.com',  role: 'parent',  city: 'Hyderabad' },
        { name: 'Demo Admin',   email: 'admin.demo@acadhr.com',   role: 'admin',   city: 'Hyderabad' },
      ];
      for (const d of DEMO) {
        try {
          // 1) user row — create if missing, else refresh password/verified/active
          const [[ex]] = await db.query('SELECT id FROM users WHERE email=?', [d.email]);
          let id;
          if (ex) {
            id = ex.id;
            await db.query('UPDATE users SET password=?, role=?, is_email_verified=1, is_active=1 WHERE id=?', [hash, d.role, id]);
          } else {
            const [r] = await db.query(
              'INSERT INTO users (name,email,password,phone,city,role,is_email_verified,is_active) VALUES (?,?,?,?,?,?,1,1)',
              [d.name, d.email, hash, '9999999999', d.city, d.role]
            );
            id = r.insertId;
          }
          // 2) credits = 25 (so testing is never blocked)
          try { await addCol('users', 'credits', 'INT DEFAULT 0'); } catch {}
          await db.query('UPDATE users SET credits=25 WHERE id=?', [id]);

          // 3) role-specific profile row (minimal sample data), created if missing
          if (d.role === 'teacher') {
            const [[t]] = await db.query('SELECT user_id FROM teachers WHERE user_id=?', [id]);
            if (!t) await db.query('INSERT INTO teachers (user_id, subject, experience, qualification, bio) VALUES (?,?,?,?,?)',
              [id, 'Mathematics, Physics', '3-5 years', 'M.Sc, B.Ed', 'Demo teacher account for testing.']);
          } else if (d.role === 'tutor') {
            const [[t]] = await db.query('SELECT user_id FROM tutors WHERE user_id=?', [id]);
            if (!t) {
              try {
                await db.query('INSERT INTO tutors (user_id, subject, subjects, experience, qualification, teaching_mode, profile_status) VALUES (?,?,?,?,?,?,?)',
                  [id, 'Mathematics', 'Mathematics, Science', '3-5 years', 'M.Sc', 'Both', 'Active']);
              } catch (e) {
                await db.query('INSERT INTO tutors (user_id, subject, experience, qualification, teaching_mode) VALUES (?,?,?,?,?)',
                  [id, 'Mathematics', '3-5 years', 'M.Sc', 'Both']);
              }
            }
          } else if (d.role === 'parent') {
            const [[p]] = await db.query('SELECT user_id FROM parents WHERE user_id=?', [id]);
            if (!p) {
              try { await db.query('INSERT INTO parents (user_id, student_name, student_class, subject, credits) VALUES (?,?,?,?,25)',
                [id, 'Demo Student', 'Grade 8', 'Mathematics']); }
              catch (e) { await db.query('INSERT INTO parents (user_id, student_name, student_class, subject) VALUES (?,?,?,?)',
                [id, 'Demo Student', 'Grade 8', 'Mathematics']); }
            } else {
              try { await db.query('UPDATE parents SET credits=25 WHERE user_id=?', [id]); } catch {}
            }
          } else if (d.role === 'school') {
            const [[s]] = await db.query('SELECT user_id FROM schools WHERE user_id=?', [id]);
            if (!s) {
              try { await db.query('INSERT INTO schools (user_id, name, institute_type) VALUES (?,?,?)',
                [id, 'Demo Public School', 'School (CBSE)']); }
              catch (e) { await db.query('INSERT INTO schools (user_id, name) VALUES (?,?)', [id, 'Demo Public School']); }
            }
          }
          console.log(`  ✓ demo ${d.role}: ${d.email}`);
        } catch (e) { console.error(`  ⚠️ demo ${d.role} failed:`, e.message); }
      }
      console.log(`✅  Demo accounts ready — password: ${DEMO_PASS}  (unset SEED_DEMO to stop re-seeding)`);
    } catch (err) { console.error('⚠️  Demo seeding:', err.message); }
  }

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
      ['terms_accepted',"VARCHAR(10) DEFAULT 'No'"],
    ]) await addCol('teachers', col, def);
    // ADDED: State & Country from teacher registration (shown in My Profile)
    await addCol('teachers', 'state',   'VARCHAR(100)');
    await addCol('teachers', 'country', 'VARCHAR(100)');
    // ADDED: widen columns that multi-select fields can overflow. In MySQL strict mode a value longer
    // than the column makes the whole save fail ("Data too long for column ..."), e.g. a teacher who
    // picks many subjects or qualifications at registration.
    for (const [col, def] of [
      ['subject','VARCHAR(1000)'],['qualification','VARCHAR(1000)'],['specialization','VARCHAR(1000)'],
      ['preferred_locations','VARCHAR(1500)'],
    ]) { try { await db.query(`ALTER TABLE \`teachers\` MODIFY COLUMN \`${col}\` ${def}`); } catch {} }
    // ADDED: repair accounts left half-created by that error (login exists, teacher profile missing),
    // so those teachers can log in and complete Edit Profile instead of being stuck.
    try {
      await db.query(`INSERT INTO teachers (user_id, full_name, mobile, current_location)
                      SELECT u.id, u.name, u.phone, u.city FROM users u
                      WHERE u.role = 'teacher' AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = u.id)`);
    } catch {}
    // Widen demo_link so it can safely hold up to 3 Google Drive URLs
    try { await db.query('ALTER TABLE `teachers` MODIFY COLUMN `demo_link` VARCHAR(1500)'); } catch {}
    console.log('✅  Teachers table ready');
  } catch (err) { console.error('⚠️  Teachers migration:', err.message); }

  // Tutors table — extra fields (multi subjects/qualifications, address, resume, etc.)
  try {
    for (const [col, def] of [
      ['subjects','TEXT'], ['qualifications','TEXT'],
      ['address','VARCHAR(300)'], ['location','VARCHAR(200)'], ['pincode','VARCHAR(20)'],
      ['availability','VARCHAR(200)'], ['class_link','VARCHAR(500)'],
      ['resume_link','VARCHAR(500)'], ['resume_file_name','VARCHAR(300)'],
    ]) await addCol('tutors', col, def);
    // Widen so the joined multi-select values fit
    try { await db.query('ALTER TABLE `tutors` MODIFY COLUMN `subject` VARCHAR(255)'); } catch {}
    try { await db.query('ALTER TABLE `tutors` MODIFY COLUMN `qualification` VARCHAR(255)'); } catch {}
    console.log('✅  Tutors table ready');
  } catch (err) { console.error('⚠️  Tutors migration:', err.message); }

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
  console.log('✅  Database setup complete\n');
}
