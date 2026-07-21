'use strict';
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateRequirementId } = require('../utils/reqId');

// Make sure the tutors.gender column exists (runs once, lazily) so public tutor
// listings can always return gender instead of silently dropping it.
let _tutorGenderReady = false;
async function ensureTutorGenderColumn() {
  if (_tutorGenderReady) return;
  try {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tutors' AND COLUMN_NAME='gender'`
    );
    if (!rows.length) await db.query("ALTER TABLE tutors ADD COLUMN `gender` VARCHAR(20)");
  } catch (e) { /* ignore */ }
  _tutorGenderReady = true;
}

// Make sure the extra parent columns exist (runs once, lazily) so admin views
// can fetch and save the full parent registration details.
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
    } catch (e) { /* ignore */ }
  }
  _parentColsReady = true;
}

// Helper: create a base user row for an admin-added teacher/tutor/parent.
async function insertUser({ name, email, phone, city, role, password }) {
  const [[exists]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) { const e = new Error('A user with this email already exists.'); e.status = 409; throw e; }
  const hash = await bcrypt.hash(password || 'Welcome@123', 12);
  const [r] = await db.query(
    'INSERT INTO users (name, email, password, phone, city, role, is_email_verified, is_active) VALUES (?,?,?,?,?,?,1,1)',
    [name, email, hash, phone || null, city || null, role]
  );
  return r.insertId;
}

async function getStats(req, res) {
  try {
    const [[t]]  = await db.query("SELECT COUNT(*) AS c FROM users WHERE role='teacher'");
    const [[tu]] = await db.query("SELECT COUNT(*) AS c FROM users WHERE role='tutor'");
    const [[s]]  = await db.query("SELECT COUNT(*) AS c FROM users WHERE role='school'");
    const [[aj]] = await db.query("SELECT COUNT(*) AS c FROM jobs WHERE status='approved'");
    const [[pj]] = await db.query("SELECT COUNT(*) AS c FROM jobs WHERE status='pending'");
    const [[ap]] = await db.query("SELECT COUNT(*) AS c FROM applications");
    const [[pa]] = await db.query("SELECT COUNT(*) AS c FROM users WHERE role='parent'");
    res.json({ teachers: t.c, tutors: tu.c, schools: s.c, activeJobs: aj.c, pendingJobs: pj.c, totalApplications: ap.c, parents: pa.c });
  } catch (err) { res.status(500).json({ message: 'Error fetching stats.' }); }
}

async function getAllUsers(req, res) {
  try {
    const [users] = await db.query(
      'SELECT id,name,email,role,city,phone,is_email_verified,is_active,created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'Error fetching users.' }); }
}

async function getTeachers(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
             t.specialization, t.total_experience, t.qualification, t.current_role,
             t.profile_status, t.completion_pct, t.profile_photo,
             t.mobile, t.subjects, t.resume_link, t.resume_file_name,
             t.languages, t.work_mode, t.gender, t.current_location,
             t.grades_handling, t.boards_handled,
             t.full_name, t.dob, t.preferred_locations, t.relevant_experience,
             t.current_org, t.current_salary, t.expected_salary, t.notice_period,
             t.available_from, t.certifications, t.tutor_type, t.competitive_exams,
             t.teaching_mode, t.demo_available, t.demo_link,
             t.residential_pref, t.relocation_ready, t.accommodation_req,
             t.aadhaar_verified, t.remarks, t.terms_accepted
      FROM users u LEFT JOIN teachers t ON t.user_id=u.id
      WHERE u.role='teacher' ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching teachers: ' + err.message }); }
}

async function getTutors(req, res) {
  try {
    await ensureTutorGenderColumn();
    let rows;
    try {
      [rows] = await db.query(`
        SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
               t.subject, t.subjects, t.experience, t.qualification, t.qualifications,
               t.teaching_mode, t.hourly_rate, t.bio, t.address, t.location, t.pincode,
               t.availability, t.class_link, t.resume_link, t.resume_file_name, t.gender
        FROM users u LEFT JOIN tutors t ON t.user_id=u.id
        WHERE u.role='tutor' ORDER BY u.created_at DESC
      `);
    } catch (e) {
      // gender column may not exist yet on older databases — fall back without it
      [rows] = await db.query(`
        SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
               t.subject, t.subjects, t.experience, t.qualification, t.qualifications,
               t.teaching_mode, t.hourly_rate, t.bio, t.address, t.location, t.pincode,
               t.availability, t.class_link, t.resume_link, t.resume_file_name
        FROM users u LEFT JOIN tutors t ON t.user_id=u.id
        WHERE u.role='tutor' ORDER BY u.created_at DESC
      `);
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching tutors: ' + err.message }); }
}

async function getSchools(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
             s.institute_name, s.institute_type, s.est_year, s.student_count, s.website,
             (SELECT COUNT(*) FROM jobs j WHERE j.posted_by=u.id) AS total_jobs,
             (SELECT COUNT(*) FROM jobs j WHERE j.posted_by=u.id AND j.status='approved') AS live_jobs,
             (SELECT COUNT(*) FROM jobs j WHERE j.posted_by=u.id AND j.status='pending') AS pending_jobs
      FROM users u LEFT JOIN schools s ON s.user_id=u.id
      WHERE u.role='school' ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching schools: ' + err.message }); }
}

async function getParents(req, res) {
  try {
    await ensureParentColumns();
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
             p.student_name, p.student_class, p.board, p.subject,
             p.location, p.mode, p.preferred_time, p.budget,
             p.tutor_gender_pref, p.experience_req, p.status, p.assigned_tutor, p.notes,
             p.state, p.pincode, p.landmark, p.hourly_budget, p.institute_name,
             p.courses, p.preferred_days
      FROM users u LEFT JOIN parents p ON p.user_id=u.id
      WHERE u.role='parent' ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching parents: ' + err.message }); }
}

async function getAllJobs(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT j.*, u.name AS institute_name, u.email AS institute_email, u.city AS institute_city,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.id) AS applicant_count
      FROM jobs j JOIN users u ON j.posted_by=u.id
      ORDER BY j.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching jobs: ' + err.message }); }
}

async function getPendingJobs(req, res) {
  try {
    const [jobs] = await db.query(`
      SELECT j.*, u.name AS institute_name, u.email AS posted_by_email,
             u.phone AS institute_phone, u.city AS institute_city_user
      FROM jobs j JOIN users u ON j.posted_by=u.id
      WHERE j.status='pending' ORDER BY j.created_at DESC
    `);
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: 'Error fetching pending jobs.' }); }
}

async function updateJob(req, res) {
  try {
    const { action } = req.body;
    // Existing approve / reject behaviour — unchanged.
    if (action === 'approve' || action === 'reject') {
      const status = action === 'approve' ? 'approved' : 'rejected';
      await db.query('UPDATE jobs SET status=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?', [status, req.user.id, req.params.id]);
      return res.json({ message: `Job ${status}.` });
    }

    // Otherwise: full field update from the admin job form.
    const b = req.body;
    const grades = Array.isArray(b.grades) ? b.grades.join(', ') : (b.grades || null);
    const fields = {
      institution_name:  b.institution_name || null,
      institution_type:  b.institution_type || null,
      location_state:    b.location_state || null,
      location_city:     b.location_city || null,
      contact_person:    b.contact_person || null,
      contact_number:    b.contact_number || null,
      contact_email:     b.contact_email || null,
      requirement_type:  b.requirement_type || 'Teacher',
      title:             b.title || ((b.requirement_type || 'Teacher') + ' — ' + (b.subject || '')),
      subject:           b.subject || null,
      grades,
      board:             b.board || null,
      experience:        b.experience || null,
      salary_min:        b.salary_min || null,
      salary_max:        b.salary_max || null,
      joining_timeline:  b.joining_timeline || null,
      work_mode:         b.work_mode || null,
      residential:       b.residential || 'No',
      accommodation:     b.accommodation || 'Not Provided',
      gender_preference: b.gender_preference || 'No Preference',
      interview_mode:    b.interview_mode || 'Online',
      demo_required:     b.demo_required || 'No',
      positions:         b.positions || 1,
      description:       b.description || b.notes || null,
      notes:             b.notes || null,
      assigned_recruiter:b.assigned_recruiter || null,
    };
    if (b.status) fields.status = b.status;
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    const vals = keys.map(k => fields[k]); vals.push(req.params.id);
    await db.query(`UPDATE jobs SET ${setClause} WHERE id = ?`, vals);
    res.json({ message: 'Job updated successfully.' });
  } catch (err) { res.status(500).json({ message: 'Error updating job: ' + err.message }); }
}

async function toggleUser(req, res) {
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id=?', [req.params.id]);
    res.json({ message: 'User status updated.' });
  } catch (err) { res.status(500).json({ message: 'Error toggling user.' }); }
}

async function getAnalytics(req, res) {
  try {
    const [regTrend]   = await db.query(`SELECT DATE(created_at) AS date, role, COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at), role ORDER BY date ASC`);
    const [jobTrend]   = await db.query(`SELECT DATE(created_at) AS date, status, COUNT(*) AS count FROM jobs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at), status ORDER BY date ASC`);
    const [topSubjects]= await db.query(`SELECT subject, COUNT(*) AS count FROM jobs WHERE subject IS NOT NULL AND subject != '' GROUP BY subject ORDER BY count DESC LIMIT 8`);
    const [topCities]  = await db.query(`SELECT city, COUNT(*) AS count FROM users WHERE city IS NOT NULL AND city != '' AND role='teacher' GROUP BY city ORDER BY count DESC LIMIT 8`);
    // ── Monthly trends (all-time) used by the overview cumulative charts so the
    //    graph's running total matches the all-time totals shown on the stat cards. ──
    const [regTrendMonthly] = await db.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, role, COUNT(*) AS count FROM users GROUP BY ym, role ORDER BY ym ASC`);
    const [jobTrendMonthly] = await db.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS count FROM jobs GROUP BY ym ORDER BY ym ASC`);
    // ── Last-30-days day-wise trends + all-time totals. The overview charts seed
    //    the cumulative line with (total − 30-day additions) so the line ends at
    //    the all-time total shown on the stat cards. ──
    const [regTrend30] = await db.query(`SELECT DATE(created_at) AS date, role, COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) GROUP BY DATE(created_at), role ORDER BY date ASC`);
    const [jobTrend30] = await db.query(`SELECT DATE(created_at) AS date, COUNT(*) AS count FROM jobs WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) GROUP BY DATE(created_at) ORDER BY date ASC`);
    const [regTotals]  = await db.query(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`);
    const [[jobTotalRow]] = await db.query(`SELECT COUNT(*) AS count FROM jobs`);
    res.json({ regTrend, jobTrend, topSubjects, topCities, regTrendMonthly, jobTrendMonthly, regTrend30, jobTrend30, regTotals, jobTotal: jobTotalRow.count });
  } catch (err) { res.status(500).json({ message: 'Error fetching analytics: ' + err.message }); }
}

async function getTutorsForParent(req, res) {
  try {
    const { subject, city } = req.query;
    let q = `SELECT u.id, u.name, u.city, u.phone, u.email, t.subject, t.experience, t.qualification, t.teaching_mode, t.hourly_rate, t.bio FROM users u LEFT JOIN tutors t ON t.user_id=u.id WHERE u.role='tutor' AND u.is_active=1`;
    const params = [];
    if (subject) { q += ' AND t.subject LIKE ?'; params.push(`%${subject}%`); }
    if (city)    { q += ' AND u.city LIKE ?';    params.push(`%${city}%`); }
    q += ' ORDER BY u.created_at DESC';
    const [rows] = await db.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching tutors: ' + err.message }); }
}

// Public tuition requirements posted by parents (no auth, no contact details exposed)
async function getTuitions(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.city AS user_city, u.created_at,
             p.student_class, p.board, p.subject, p.location, p.mode,
             p.preferred_time, p.budget, p.tutor_gender_pref, p.experience_req, p.status, p.notes
      FROM parents p JOIN users u ON u.id = p.user_id
      WHERE u.role='parent' AND u.is_active=1
        AND (p.status IS NULL OR p.status <> 'Closed')
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching tuitions: ' + err.message }); }
}

// ── Admin: add new records ────────────────────────────────────────────────────
// POST /api/admin/teachers
async function createTeacher(req, res) {
  try {
    // Accept the full teacher-profile form (same fields the teacher's own
    // "Edit Profile" sends) as well as the older simple field names.
    const b     = req.body;
    const name  = b.full_name || b.name;
    const email = b.email;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });

    const userId = await insertUser({
      name,
      email,
      phone: b.mobile || b.phone || null,
      city:  b.current_location || b.city || null,
      role: 'teacher',
      password: b.password,
    });

    // Persist using the SAME column list the teacher profile save uses, so an
    // admin-created teacher is identical to a self-registered one.
    const fields = [
      'full_name','mobile','gender','dob','current_location','preferred_locations',
      'qualification','specialization','total_experience','relevant_experience',
      'current_role','current_org','current_salary','expected_salary',
      'notice_period','available_from','certifications',
      'work_mode','tutor_type','subjects','grades_handling','boards_handled',
      'competitive_exams','teaching_mode','languages',
      'demo_available','demo_link','residential_pref','relocation_ready',
      'accommodation_req','aadhaar_verified','resume_link','resume_file_name',
      'profile_status','remarks','completion_pct','profile_photo','terms_accepted',
    ];
    const dateFields = ['dob','available_from'];
    const sanitize = (f, val) => {
      if (val === undefined || val === '' || val === null) return null;
      if (dateFields.includes(f) && typeof val === 'string' && val.includes('T')) return val.split('T')[0];
      return val;
    };
    const body = {
      ...b,
      full_name:      b.full_name || name,
      specialization: b.specialization || b.subject || null,
      profile_status: b.profile_status || 'Active',
    };

    try {
      const insertFields = ['user_id', ...fields];
      const insertVals   = [userId, ...fields.map(f => sanitize(f, body[f]))];
      await db.query(
        `INSERT INTO teachers (${insertFields.map(f => `\`${f}\``).join(', ')})
         VALUES (${insertFields.map(() => '?').join(', ')})`,
        insertVals
      );
    } catch (e) {
      // Fallback for a minimal teachers schema.
      await db.query(
        'INSERT INTO teachers (user_id, specialization, qualification) VALUES (?,?,?)',
        [userId, sanitize('specialization', body.specialization), sanitize('qualification', body.qualification)]
      );
    }
    res.status(201).json({ message: 'Teacher added successfully.', id: userId });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error adding teacher.' }); }
}

// PATCH /api/admin/teachers/:id  — update an existing teacher's full profile
async function updateTeacher(req, res) {
  try {
    const userId = req.params.id;
    const b = req.body;
    const [[u]] = await db.query("SELECT id FROM users WHERE id=? AND role='teacher'", [userId]);
    if (!u) return res.status(404).json({ message: 'Teacher not found.' });

    // Update the base user account.
    const name  = b.full_name || b.name;
    const phone = b.mobile || b.phone || null;
    const city  = b.current_location || b.city || null;
    if (name) await db.query('UPDATE users SET name=?, phone=?, city=? WHERE id=?', [name, phone, city, userId]);

    // Optional email change (kept unique).
    if (b.email) {
      const [[clash]] = await db.query('SELECT id FROM users WHERE email=? AND id<>?', [b.email, userId]);
      if (clash) return res.status(409).json({ message: 'Another user already uses this email.' });
      await db.query('UPDATE users SET email=? WHERE id=?', [b.email, userId]);
    }
    // Optional password reset (only when a new one is typed).
    if (b.password && String(b.password).trim()) {
      const hash = await bcrypt.hash(b.password, 12);
      await db.query('UPDATE users SET password=? WHERE id=?', [hash, userId]);
    }

    // Update the teacher profile using the same columns the teacher's own save uses.
    const fields = [
      'full_name','mobile','gender','dob','current_location','preferred_locations',
      'qualification','specialization','total_experience','relevant_experience',
      'current_role','current_org','current_salary','expected_salary',
      'notice_period','available_from','certifications',
      'work_mode','tutor_type','subjects','grades_handling','boards_handled',
      'competitive_exams','teaching_mode','languages',
      'demo_available','demo_link','residential_pref','relocation_ready',
      'accommodation_req','aadhaar_verified','resume_link','resume_file_name',
      'profile_status','remarks','completion_pct','profile_photo','terms_accepted',
    ];
    const dateFields = ['dob','available_from'];
    const sanitize = (f, val) => {
      if (val === undefined || val === '' || val === null) return null;
      if (dateFields.includes(f) && typeof val === 'string' && val.includes('T')) return val.split('T')[0];
      return val;
    };
    const setClauses = fields.map(f => `\`${f}\` = ?`).join(', ');
    const values     = fields.map(f => sanitize(f, b[f]));
    values.push(userId);
    const [result] = await db.query(`UPDATE teachers SET ${setClauses} WHERE user_id = ?`, values);
    if (result.affectedRows === 0) {
      const insertFields = ['user_id', ...fields];
      const insertVals   = [userId, ...fields.map(f => sanitize(f, b[f]))];
      await db.query(
        `INSERT INTO teachers (${insertFields.map(f => `\`${f}\``).join(', ')})
         VALUES (${insertFields.map(() => '?').join(', ')})`,
        insertVals
      );
    }
    res.json({ message: 'Teacher updated successfully.' });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error updating teacher.' }); }
}

// POST /api/admin/tutors
async function createTutor(req, res) {
  try {
    const { name, email, phone, city, subject, experience, qualification, hourly_rate, teaching_mode, password } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });
    const userId = await insertUser({ name, email, phone, city, role: 'tutor', password });
    await db.query(
      'INSERT INTO tutors (user_id, subject, experience, qualification, hourly_rate, teaching_mode) VALUES (?,?,?,?,?,?)',
      [userId, subject||null, experience||null, qualification||null, hourly_rate||null, teaching_mode||'Both']
    );
    res.status(201).json({ message: 'Tutor added successfully.', id: userId });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error adding tutor.' }); }
}

// PATCH /api/admin/tutors/:id  — update an existing tutor's full profile
async function updateTutor(req, res) {
  try {
    const userId = req.params.id;
    const b = req.body;
    const [[u]] = await db.query("SELECT id FROM users WHERE id=? AND role='tutor'", [userId]);
    if (!u) return res.status(404).json({ message: 'Tutor not found.' });

    if (b.name) await db.query('UPDATE users SET name=?, phone=?, city=? WHERE id=?',
      [b.name, b.phone || null, b.city || null, userId]);
    if (b.email) {
      const [[clash]] = await db.query('SELECT id FROM users WHERE email=? AND id<>?', [b.email, userId]);
      if (clash) return res.status(409).json({ message: 'Another user already uses this email.' });
      await db.query('UPDATE users SET email=? WHERE id=?', [b.email, userId]);
    }
    if (b.password && String(b.password).trim()) {
      const hash = await bcrypt.hash(b.password, 12);
      await db.query('UPDATE users SET password=? WHERE id=?', [hash, userId]);
    }

    // The multi-selects (subjects / qualifications / availability) arrive as comma strings.
    const subjectStr = b.subjects || b.subject || null;
    const qualStr    = b.qualifications || b.qualification || null;
    const fields = {
      subject: subjectStr, subjects: b.subjects || null,
      experience: b.experience || null,
      qualification: qualStr, qualifications: b.qualifications || null,
      hourly_rate: b.hourly_rate || null,
      teaching_mode: b.teaching_mode || 'Both',
      bio: b.bio || null,
      address: b.address || null,
      location: b.location || b.tutor_location || null,
      pincode: b.pincode || null,
      availability: b.availability || null,
      class_link: b.class_link || null,
      resume_link: b.resume_link || null,
      resume_file_name: b.resume_file_name || null,
    };
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    const vals = keys.map(k => fields[k]);
    vals.push(userId);
    try {
      const [result] = await db.query(`UPDATE tutors SET ${setClause} WHERE user_id = ?`, vals);
      if (result.affectedRows === 0) {
        await db.query(
          `INSERT INTO tutors (user_id, ${keys.map(k => `\`${k}\``).join(', ')})
           VALUES (${['?', ...keys.map(() => '?')].join(', ')})`,
          [userId, ...keys.map(k => fields[k])]
        );
      }
    } catch (e) {
      // Fallback to the minimal columns if the extended tutor schema isn't present.
      await db.query('UPDATE tutors SET subject=?, experience=?, qualification=?, hourly_rate=?, teaching_mode=?, bio=? WHERE user_id=?',
        [subjectStr, b.experience||null, qualStr, b.hourly_rate||null, b.teaching_mode||'Both', b.bio||null, userId]);
    }
    res.json({ message: 'Tutor updated successfully.' });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error updating tutor.' }); }
}

// PATCH /api/admin/schools/:id  — update an existing school/institution profile
async function updateSchool(req, res) {
  try {
    const userId = req.params.id;
    const b = req.body;
    const [[u]] = await db.query("SELECT id FROM users WHERE id=? AND role='school'", [userId]);
    if (!u) return res.status(404).json({ message: 'Institution not found.' });

    if (b.name) await db.query('UPDATE users SET name=?, phone=?, city=? WHERE id=?',
      [b.name, b.phone || null, b.city || null, userId]);
    if (b.email) {
      const [[clash]] = await db.query('SELECT id FROM users WHERE email=? AND id<>?', [b.email, userId]);
      if (clash) return res.status(409).json({ message: 'Another user already uses this email.' });
      await db.query('UPDATE users SET email=? WHERE id=?', [b.email, userId]);
    }
    if (b.password && String(b.password).trim()) {
      const hash = await bcrypt.hash(b.password, 12);
      await db.query('UPDATE users SET password=? WHERE id=?', [hash, userId]);
    }

    const fields = {
      institute_name: b.institute_name || b.name || null,
      institute_type: b.institute_type || null,
      est_year:       b.est_year || null,
      student_count:  b.student_count || null,
      website:        b.website || null,
    };
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    const vals = keys.map(k => fields[k]); vals.push(userId);
    const [result] = await db.query(`UPDATE schools SET ${setClause} WHERE user_id = ?`, vals);
    if (result.affectedRows === 0) {
      await db.query(
        `INSERT INTO schools (user_id, ${keys.map(k => `\`${k}\``).join(', ')})
         VALUES (${['?', ...keys.map(() => '?')].join(', ')})`,
        [userId, ...keys.map(k => fields[k])]
      );
    }
    res.json({ message: 'Institution updated successfully.' });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error updating institution.' }); }
}

// PATCH /api/admin/parents/:id  — update an existing parent + tuition requirement
async function updateParent(req, res) {
  try {
    const userId = req.params.id;
    const b = req.body;
    const [[u]] = await db.query("SELECT id FROM users WHERE id=? AND role='parent'", [userId]);
    if (!u) return res.status(404).json({ message: 'Parent not found.' });

    if (b.name) await db.query('UPDATE users SET name=?, phone=?, city=? WHERE id=?',
      [b.name, b.phone || null, b.city || null, userId]);
    if (b.email) {
      const [[clash]] = await db.query('SELECT id FROM users WHERE email=? AND id<>?', [b.email, userId]);
      if (clash) return res.status(409).json({ message: 'Another user already uses this email.' });
      await db.query('UPDATE users SET email=? WHERE id=?', [b.email, userId]);
    }
    if (b.password && String(b.password).trim()) {
      const hash = await bcrypt.hash(b.password, 12);
      await db.query('UPDATE users SET password=? WHERE id=?', [hash, userId]);
    }

    // Update the tuition requirement (status / assigned_tutor are left untouched).
    await ensureParentColumns();
    const fields = {
      student_name:      b.student_name || null,
      student_class:     b.student_class || null,
      board:             b.board || null,
      subject:           b.subject || null,
      location:          b.location || null,
      mode:              b.mode || null,
      preferred_time:    b.preferred_time || null,
      budget:            b.budget || null,
      tutor_gender_pref: b.tutor_gender_pref || null,
      experience_req:    b.experience_req || null,
      notes:             b.notes || null,
      state:             b.state || null,
      pincode:           b.pincode || null,
      landmark:          b.landmark || null,
      hourly_budget:     b.hourly_budget || null,
      institute_name:    b.institute_name || null,
      courses:           b.courses || null,
      preferred_days:    b.preferred_days || null,
    };
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    const vals = keys.map(k => fields[k]); vals.push(userId);
    const [result] = await db.query(`UPDATE parents SET ${setClause} WHERE user_id = ?`, vals);
    if (result.affectedRows === 0) {
      await db.query(
        `INSERT INTO parents (user_id, ${keys.map(k => `\`${k}\``).join(', ')})
         VALUES (${['?', ...keys.map(() => '?')].join(', ')})`,
        [userId, ...keys.map(k => fields[k])]
      );
    }
    res.json({ message: 'Parent updated successfully.' });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error updating parent.' }); }
}

// POST /api/admin/tuitions  (a tuition requirement is a parent record)
async function createTuition(req, res) {
  try {
    const { name, email, phone, city, student_name, student_class, board, subject,
            location, mode, preferred_time, budget, tutor_gender_pref, experience_req, notes, password } = req.body;
    const { courses, preferred_days } = req.body;
    const { state, pincode, landmark, institute_name, hourly_budget } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Parent name and email are required.' });
    const userId = await insertUser({ name, email, phone, city, role: 'parent', password });
    await ensureParentColumns();
    try {
      await db.query(
        `INSERT INTO parents (user_id, student_name, student_class, board, subject, location, mode,
           preferred_time, budget, tutor_gender_pref, experience_req, notes, courses, preferred_days,
           state, pincode, landmark, institute_name, hourly_budget)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, student_name||null, student_class||null, board||null, subject||null,
         location||city||null, mode||null, preferred_time||null, budget||null,
         tutor_gender_pref||null, experience_req||null, notes||null, courses||null, preferred_days||null,
         state||null, pincode||null, landmark||null, institute_name||null, hourly_budget||null]
      );
    } catch (e) {
      console.error('[createTuition] rich insert failed, using fallback:', e.message);
      await db.query(
        `INSERT INTO parents (user_id, student_name, student_class, board, subject, location, mode,
           preferred_time, budget, tutor_gender_pref, experience_req, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, student_name||null, student_class||null, board||null, subject||null,
         location||city||null, mode||null, preferred_time||null, budget||null,
         tutor_gender_pref||null, experience_req||null, notes||null]
      );
    }
    res.status(201).json({ message: 'Tuition requirement added successfully.', id: userId });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error adding tuition.' }); }
}

// POST /api/admin/jobs
async function createAdminJob(req, res) {
  try {
    const {
      institution_name, institution_type, location_state, location_city,
      contact_person, contact_number, contact_email,
      requirement_type, title, subject, grades, board, experience,
      job_type, salary_min, salary_max, joining_timeline, work_mode,
      residential, accommodation, gender_preference,
      interview_mode, demo_required, positions,
      description, notes, assigned_recruiter, status,
    } = req.body;
    if (!subject && !title) return res.status(400).json({ message: 'Subject or title is required.' });

    const requirement_id = await generateRequirementId();
    const jobTitle = title || `${requirement_type || 'Teacher'} — ${subject}`;
    const gradesStr = Array.isArray(grades) ? grades.join(',') : (grades || '');
    const finalStatus = (status === 'pending' || status === 'rejected') ? status : 'approved';

    const [result] = await db.query(
      `INSERT INTO jobs (
         requirement_id, institution_name, institution_type,
         location_state, location_city, contact_person, contact_number, contact_email,
         requirement_type, title, subject, grades, board, experience,
         job_type, salary_min, salary_max, joining_timeline, work_mode,
         residential, accommodation, gender_preference,
         interview_mode, demo_required, positions,
         description, notes, assigned_recruiter, status, posted_by
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        requirement_id, institution_name||null, institution_type||null,
        location_state||null, location_city||null,
        contact_person||null, contact_number||null, contact_email||null,
        requirement_type||'Teacher', jobTitle, subject||null, gradesStr, board||'CBSE', experience||null,
        job_type||'Full-time', salary_min||null, salary_max||null,
        joining_timeline||'Immediate', work_mode||'Full-time',
        residential||'No', accommodation||'Not Provided',
        gender_preference||'No Preference',
        interview_mode||'Online', demo_required||'No', positions||1,
        description||null, notes||null, assigned_recruiter||null,
        finalStatus, req.user.id,
      ]
    );
    res.status(201).json({ message: 'Job added successfully.', jobId: result.insertId, requirement_id });
  } catch (err) { res.status(err.status || 500).json({ message: err.message || 'Error adding job.' }); }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDED (fix #1): PUBLIC-SAFE versions of the listing endpoints.
// These return ONLY display-safe fields for the public website (no email, no
// phone/mobile, no DOB, no salaries, no admin remarks). The original full-data
// functions above are untouched and remain admin-only.
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/public/teachers — safe fields only
async function getPublicTeachers(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.city, u.is_active, u.created_at,
             t.specialization, t.total_experience, t.qualification, t.current_role,
             t.profile_status, t.completion_pct, t.profile_photo,
             t.subjects, t.languages, t.work_mode, t.gender, t.current_location,
             t.grades_handling, t.boards_handled,
             t.full_name, t.preferred_locations, t.relevant_experience,
             t.current_org, t.certifications, t.tutor_type, t.competitive_exams,
             t.teaching_mode, t.demo_available, t.demo_link,
             t.residential_pref, t.relocation_ready, t.accommodation_req
      FROM users u LEFT JOIN teachers t ON t.user_id=u.id
      WHERE u.role='teacher' AND u.is_active=1 ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching teachers: ' + err.message }); }
}

// GET /api/admin/public/tutors — safe fields only
async function getPublicTutors(req, res) {
  try {
    await ensureTutorGenderColumn();
    let rows;
    try {
      [rows] = await db.query(`
        SELECT u.id, u.name, u.city, u.is_active, u.created_at,
               t.subject, t.subjects, t.experience, t.qualification, t.qualifications,
               t.teaching_mode, t.hourly_rate, t.bio, t.location,
               t.availability, t.gender
        FROM users u LEFT JOIN tutors t ON t.user_id=u.id
        WHERE u.role='tutor' AND u.is_active=1
          AND (t.profile_status IS NULL OR t.profile_status IN ('Active','Approved'))
        ORDER BY u.created_at DESC
      `);
    } catch (e) {
      // gender column may not exist yet on older databases — fall back without it
      [rows] = await db.query(`
        SELECT u.id, u.name, u.city, u.is_active, u.created_at,
               t.subject, t.subjects, t.experience, t.qualification, t.qualifications,
               t.teaching_mode, t.hourly_rate, t.bio, t.location,
               t.availability
        FROM users u LEFT JOIN tutors t ON t.user_id=u.id
        WHERE u.role='tutor' AND u.is_active=1
          AND (t.profile_status IS NULL OR t.profile_status IN ('Active','Approved'))
        ORDER BY u.created_at DESC
      `);
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching tutors: ' + err.message }); }
}

// GET /api/admin/public/schools — safe fields only
async function getPublicSchools(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.city, u.is_active, u.created_at,
             s.institute_name, s.institute_type, s.est_year, s.student_count, s.website,
             (SELECT COUNT(*) FROM jobs j WHERE j.posted_by=u.id) AS total_jobs,
             (SELECT COUNT(*) FROM jobs j WHERE j.posted_by=u.id AND j.status='approved') AS live_jobs,
             (SELECT COUNT(*) FROM jobs j WHERE j.posted_by=u.id AND j.status='pending') AS pending_jobs
      FROM users u LEFT JOIN schools s ON s.user_id=u.id
      WHERE u.role='school' AND u.is_active=1 ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching schools: ' + err.message }); }
}

// GET /api/admin/public/parents — safe fields only
async function getPublicParents(req, res) {
  try {
    await ensureParentColumns();
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.city, u.is_active, u.created_at,
             p.student_name, p.student_class, p.board, p.subject,
             p.location, p.mode, p.preferred_time, p.budget,
             p.tutor_gender_pref, p.experience_req, p.status,
             p.hourly_budget, p.institute_name, p.courses, p.preferred_days
      FROM users u LEFT JOIN parents p ON p.user_id=u.id
      WHERE u.role='parent' AND u.is_active=1 ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching parents: ' + err.message }); }
}

// GET /api/admin/school/teachers — for LOGGED-IN schools only (auth ['school']).
// ADDED: same safe fields as public, PLUS contact info (email, phone, mobile) so the
// School dashboard's "View Contact" works. Salaries, DOB and remarks stay admin-only.
async function getTeachersForSchool(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.city, u.is_active, u.created_at,
             u.email, u.phone,
             t.mobile,
             t.specialization, t.total_experience, t.qualification, t.current_role,
             t.profile_status, t.completion_pct, t.profile_photo,
             t.subjects, t.languages, t.work_mode, t.gender, t.current_location,
             t.grades_handling, t.boards_handled,
             t.full_name, t.preferred_locations, t.relevant_experience,
             t.current_org, t.certifications, t.tutor_type, t.competitive_exams,
             t.teaching_mode, t.demo_available, t.demo_link,
             t.residential_pref, t.relocation_ready, t.accommodation_req,
             t.resume_link, t.resume_file_name
      FROM users u LEFT JOIN teachers t ON t.user_id=u.id
      WHERE u.role='teacher' AND u.is_active=1 ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching teachers: ' + err.message }); }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDED (parent credits): every parent starts with 5 free tutor contacts.
// Server-side check so the balance cannot be bypassed from the browser.
// ═══════════════════════════════════════════════════════════════════════════
let _parentCreditsReady = false;
async function ensureParentCreditsColumn() {
  if (_parentCreditsReady) return;
  try {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='parents' AND COLUMN_NAME='credits'`
    );
    if (!rows.length) await db.query("ALTER TABLE parents ADD COLUMN `credits` INT DEFAULT 5");
  } catch (e) { /* ignore */ }
  _parentCreditsReady = true;
}

// GET /api/admin/parent/credits — remaining contact credits for the logged-in parent
async function getParentCredits(req, res) {
  try {
    await ensureParentCreditsColumn();
    const [[row]] = await db.query('SELECT COALESCE(credits, 5) AS credits FROM parents WHERE user_id = ?', [req.user.id]);
    res.json({ credits: row ? row.credits : 5 });
  } catch (err) { res.status(500).json({ message: 'Error fetching credits: ' + err.message }); }
}

// POST /api/admin/parent/use-credit — spend 1 credit to unlock a tutor contact
async function useParentCredit(req, res) {
  try {
    await ensureParentCreditsColumn();
    let [[row]] = await db.query('SELECT COALESCE(credits, 5) AS credits FROM parents WHERE user_id = ?', [req.user.id]);
    if (!row) {
      await db.query('INSERT INTO parents (user_id, credits) VALUES (?, 5)', [req.user.id]);
      row = { credits: 5 };
    }
    // ── TEMPORARILY DISABLED (per Seshu, 17-Jul-2026): the 5-tutor contact limit
    // for parents is switched OFF. Parents can now open unlimited tutor profiles.
    // To re-enable the limit later, uncomment the block below and remove the
    // temporary res.json line at the end.
    // if (row.credits <= 0) {
    //   return res.status(402).json({ message: 'No credits left. Please upgrade to continue contacting tutors.', credits: 0 });
    // }
    // await db.query('UPDATE parents SET credits = COALESCE(credits, 5) - 1 WHERE user_id = ?', [req.user.id]);
    // res.json({ credits: row.credits - 1 });
    res.json({ credits: row.credits }); // limit disabled: no credit deducted, never blocks
  } catch (err) { res.status(500).json({ message: 'Error using credit: ' + err.message }); }
}

module.exports = { getStats, getAllUsers, getTeachers, getTutors, getSchools, getParents, getAllJobs, getPendingJobs, updateJob, toggleUser, getAnalytics, getTutorsForParent, getTuitions, createTeacher, updateTeacher, createTutor, updateTutor, updateSchool, updateParent, createTuition, createAdminJob, getPublicTeachers, getPublicTutors, getPublicSchools, getPublicParents, getTeachersForSchool, getParentCredits, useParentCredit };
