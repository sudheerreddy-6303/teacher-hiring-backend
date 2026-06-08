'use strict';
const db = require('../config/db');

async function getStats(req, res) {
  try {
    const [[t]]  = await db.query("SELECT COUNT(*) AS c FROM users WHERE role='teacher'");
    const [[tu]] = await db.query("SELECT COUNT(*) AS c FROM users WHERE role='tutor'");
    const [[s]]  = await db.query("SELECT COUNT(*) AS c FROM users WHERE role='school'");
    const [[aj]] = await db.query("SELECT COUNT(*) AS c FROM jobs WHERE status='approved'");
    const [[pj]] = await db.query("SELECT COUNT(*) AS c FROM jobs WHERE status='pending'");
    const [[ap]] = await db.query("SELECT COUNT(*) AS c FROM applications");
    res.json({ teachers: t.c, tutors: tu.c, schools: s.c, activeJobs: aj.c, pendingJobs: pj.c, totalApplications: ap.c });
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
             t.grades_handling, t.boards_handled
      FROM users u LEFT JOIN teachers t ON t.user_id=u.id
      WHERE u.role='teacher' ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching teachers: ' + err.message }); }
}

async function getTutors(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
             t.subject, t.experience, t.qualification, t.teaching_mode, t.hourly_rate
      FROM users u LEFT JOIN tutors t ON t.user_id=u.id
      WHERE u.role='tutor' ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching tutors: ' + err.message }); }
}

async function getSchools(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
             s.institute_type, s.website,
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
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
             p.student_name, p.student_class, p.board, p.subject,
             p.location, p.mode, p.preferred_time, p.budget,
             p.tutor_gender_pref, p.experience_req, p.status, p.assigned_tutor
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
    const status = action === 'approve' ? 'approved' : 'rejected';
    await db.query('UPDATE jobs SET status=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?', [status, req.user.id, req.params.id]);
    res.json({ message: `Job ${status}.` });
  } catch (err) { res.status(500).json({ message: 'Error updating job.' }); }
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
    res.json({ regTrend, jobTrend, topSubjects, topCities });
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

module.exports = { getStats, getAllUsers, getTeachers, getTutors, getSchools, getParents, getAllJobs, getPendingJobs, updateJob, toggleUser, getAnalytics, getTutorsForParent, getTuitions };
