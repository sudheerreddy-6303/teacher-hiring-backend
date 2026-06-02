/**
 * Run after schema: node scripts/seed.js
 * Creates demo users with password test123 / admin123
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eduhire',
  });

  const adminHash = await bcrypt.hash('admin123', 10);
  const testHash = await bcrypt.hash('test123', 10);

  await db.query(
    `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
    ['EduHire Admin', 'admin@eduhire.com', adminHash]
  );

  await db.query(
    `INSERT IGNORE INTO users (name, email, password, role, phone, city) VALUES (?, ?, ?, 'teacher', ?, ?)`,
    ['Priya Sharma', 'teacher@test.com', testHash, '9876543210', 'Hyderabad']
  );
  const [[t]] = await db.query(`SELECT id FROM users WHERE email = 'teacher@test.com'`);
  if (t) {
    await db.query(
      `INSERT IGNORE INTO teachers (user_id, subject, experience, qualification, profile_complete, resume_url)
       VALUES (?, 'Mathematics', '5 years', 'M.Sc + B.Ed', 1, '/uploads/resumes/demo-resume.pdf')`,
      [t.id]
    );
  }

  await db.query(
    `INSERT IGNORE INTO users (name, email, password, role, phone, city) VALUES (?, ?, ?, 'school', ?, ?)`,
    ['Delhi Public School', 'school@test.com', testHash, '9123456789', 'Hyderabad']
  );
  const [[s]] = await db.query(`SELECT id FROM users WHERE email = 'school@test.com'`);
  const [[a]] = await db.query(`SELECT id FROM users WHERE email = 'admin@eduhire.com'`);
  if (s) {
    await db.query(
      `INSERT IGNORE INTO schools (user_id, institute_name, institute_type, approval_status, profile_complete, approved_by, approved_at)
       VALUES (?, 'Delhi Public School', 'School (CBSE)', 'approved', 1, ?, NOW())`,
      [s.id, a?.id || null]
    );
    if (a) {
      await db.query(
        `INSERT INTO jobs (title, subject, job_type, salary_min, salary_max, experience, description, location, posted_by, status, reviewed_by, reviewed_at)
         SELECT 'Senior Mathematics Teacher', 'Mathematics', 'Full-Time', 45000, 60000, '3+ Years', 'CBSE Math teacher Grades 9-12', 'Hyderabad', ?, 'approved', ?, NOW()
         FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE posted_by = ? LIMIT 1)`,
        [s.id, a.id, s.id]
      );
    }
  }

  console.log('Seed complete.');
  console.log('  Admin:   admin@eduhire.com / admin123');
  console.log('  Teacher: teacher@test.com / test123');
  console.log('  School:  school@test.com / test123 (approved)');
  await db.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
