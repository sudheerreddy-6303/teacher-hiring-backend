'use strict';
// ── Tutor controller (ADDED — new file, nothing replaced) ────────────────────
// Powers the "Tuitions Database" tab in the tutor dashboard:
//   • list all open tuition requirements posted by parents
//   • let a tutor apply to a tuition (one application per tutor per tuition)
//   • list the tuitions this tutor has already applied to

const db = require('../config/db');

// ADDED: a tutor must be approved by an admin before browsing/applying to tuitions.
// Grandfather older rows (NULL/empty profile_status) and Active/Approved; block only "Pending".
async function tutorIsApproved(userId) {
  try {
    const [[row]] = await db.query('SELECT profile_status FROM tutors WHERE user_id = ?', [userId]);
    const st = row ? (row.profile_status || '') : '';
    return st !== 'Pending';
  } catch (e) { return true; } // fail-open on DB error so we never lock a tutor out by accident
}

// Make sure the tuition_applications table exists (runs once, lazily).
let _appsTableReady = false;
async function ensureApplicationsTable() {
  if (_appsTableReady) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tuition_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tutor_user_id  INT NOT NULL,
        parent_user_id INT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Applied',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_tutor_parent (tutor_user_id, parent_user_id)
      )
    `);
    _appsTableReady = true;
  } catch (e) { console.error('[ensureApplicationsTable]', e.message); }
}

// GET /api/tutor/tuitions — all open tuition requirements (same data the public
// browse page shows; served with tutor auth so the dashboard can use it too).
async function listTuitions(req, res) {
  try {
    if (!(await tutorIsApproved(req.user.id))) {
      return res.status(403).json({ message: 'Your profile is pending admin approval.', pending: true });
    }
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

// GET /api/tutor/tuition-applications — tuitions this tutor already applied to
async function myTuitionApplications(req, res) {
  try {
    await ensureApplicationsTable();
    const [rows] = await db.query(
      'SELECT parent_user_id, status, created_at FROM tuition_applications WHERE tutor_user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching applications: ' + err.message }); }
}

// POST /api/tutor/tuitions/:parentId/apply — apply to a tuition (idempotent)
async function applyTuition(req, res) {
  try {
    if (!(await tutorIsApproved(req.user.id))) {
      return res.status(403).json({ message: 'Your profile is pending admin approval. You can apply once approved.', pending: true });
    }
    await ensureApplicationsTable();
    const parentId = parseInt(req.params.parentId, 10);
    if (!parentId) return res.status(400).json({ message: 'Invalid tuition id.' });

    // Confirm the tuition exists and is open
    const [[tuition]] = await db.query(
      `SELECT u.id FROM parents p JOIN users u ON u.id = p.user_id
       WHERE u.id = ? AND u.role='parent' AND u.is_active=1
         AND (p.status IS NULL OR p.status <> 'Closed')`,
      [parentId]
    );
    if (!tuition) return res.status(404).json({ message: 'Tuition not found or already closed.' });

    try {
      await db.query(
        'INSERT INTO tuition_applications (tutor_user_id, parent_user_id) VALUES (?, ?)',
        [req.user.id, parentId]
      );
    } catch (e) {
      if (e && e.code === 'ER_DUP_ENTRY') {
        return res.json({ message: 'You have already applied to this tuition.', already: true });
      }
      throw e;
    }
    res.status(201).json({ message: 'Applied successfully! The parent/admin will contact you.', applied: true });
  } catch (err) { res.status(500).json({ message: 'Error applying: ' + err.message }); }
}

module.exports = { listTuitions, myTuitionApplications, applyTuition };
