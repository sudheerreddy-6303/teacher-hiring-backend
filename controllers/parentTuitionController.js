'use strict';
// ─── Parent Tuition Posts (ADDED — new file, nothing replaced) ────────────────
// Lets a parent post MULTIPLE tuition requirements, limited by their plan:
//   Free = 1 post total, Starter = 3, Premium = 5.
// The parent's existing single "My Requirement" (parents row) counts as post #1,
// so this table only holds the EXTRA posts (#2..N). Tutors see both (the public /
// tutor tuition lists UNION this table in). Existing flows are untouched.

const db = require('../config/db');

let _tableReady = false;
async function ensureParentTuitionsTable() {
  if (_tableReady) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS parent_tuitions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_user_id    INT NOT NULL,
        student_name      VARCHAR(200),
        student_class     VARCHAR(100),
        board             VARCHAR(100),
        subject           VARCHAR(255),
        location          VARCHAR(300),
        mode              VARCHAR(50),
        preferred_time    VARCHAR(255),
        time_from         VARCHAR(255),
        budget            VARCHAR(100),
        hourly_budget     VARCHAR(50),
        tutor_gender_pref VARCHAR(50),
        experience_req    VARCHAR(100),
        landmark          VARCHAR(300),
        notes             TEXT,
        status            VARCHAR(30) NOT NULL DEFAULT 'Open',
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_parent (parent_user_id)
      )
    `);
    _tableReady = true;
  } catch (e) { console.error('[ensureParentTuitionsTable]', e.message); }
}

// Map the user's current plan → how many tuition posts they may have in total.
// Free (or no plan) = 1, Starter = 3, Premium = 5.
function postLimitForPlan(plan) {
  const p = String(plan || '').toLowerCase();
  if (p.includes('premium')) return 5;
  if (p.includes('starter')) return 3;
  return 1;
}

async function getPlanAndLimit(userId) {
  let plan = null;
  try {
    const [[u]] = await db.query('SELECT plan FROM users WHERE id = ?', [userId]);
    plan = u ? u.plan : null;
  } catch (e) { /* plan column may not exist yet → treat as free */ }
  return { plan, limit: postLimitForPlan(plan) };
}

// GET /api/parent-tuitions — this parent's extra posts + limit info
async function listMyTuitions(req, res) {
  try {
    await ensureParentTuitionsTable();
    const [rows] = await db.query(
      'SELECT * FROM parent_tuitions WHERE parent_user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const { plan, limit } = await getPlanAndLimit(req.user.id);
    // total posts used = 1 (the primary "My Requirement") + the extra posts here
    const used = 1 + rows.length;
    res.json({ posts: rows, limit, used, remaining: Math.max(limit - used, 0), plan });
  } catch (err) {
    res.json({ posts: [], limit: 1, used: 1, remaining: 0, plan: null });
  }
}

// POST /api/parent-tuitions — create a new tuition post (enforces the plan limit)
async function createMyTuition(req, res) {
  try {
    await ensureParentTuitionsTable();
    const { limit } = await getPlanAndLimit(req.user.id);
    const [[cnt]] = await db.query('SELECT COUNT(*) AS n FROM parent_tuitions WHERE parent_user_id = ?', [req.user.id]);
    const used = 1 + (cnt ? Number(cnt.n) : 0); // +1 for the primary requirement
    if (used >= limit) {
      return res.status(402).json({
        message: `Your current plan allows ${limit} tuition post${limit === 1 ? '' : 's'}. Upgrade from the Pricing tab to post more.`,
        limit, used,
      });
    }
    const b = req.body || {};
    await db.query(
      `INSERT INTO parent_tuitions
        (parent_user_id, student_name, student_class, board, subject, location, mode,
         preferred_time, time_from, budget, hourly_budget, tutor_gender_pref, experience_req, landmark, notes, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, b.student_name || null, b.student_class || null, b.board || null, b.subject || null,
       b.location || null, b.mode || null, b.preferred_time || null, b.time_from || null, b.budget || null,
       b.hourly_budget || null, b.tutor_gender_pref || null, b.experience_req || null, b.landmark || null,
       b.notes || null, b.status || 'Open']
    );
    res.status(201).json({ success: true, limit, used: used + 1 });
  } catch (err) {
    res.status(500).json({ message: 'Error creating tuition post: ' + err.message });
  }
}

// PATCH /api/parent-tuitions/:id — edit one of the parent's own posts
async function updateMyTuition(req, res) {
  try {
    await ensureParentTuitionsTable();
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid post id.' });
    const b = req.body || {};
    await db.query(
      `UPDATE parent_tuitions SET
         student_name=COALESCE(?,student_name), student_class=COALESCE(?,student_class),
         board=COALESCE(?,board), subject=COALESCE(?,subject), location=COALESCE(?,location),
         mode=COALESCE(?,mode), preferred_time=COALESCE(?,preferred_time), time_from=COALESCE(?,time_from),
         budget=COALESCE(?,budget), hourly_budget=COALESCE(?,hourly_budget),
         tutor_gender_pref=COALESCE(?,tutor_gender_pref), experience_req=COALESCE(?,experience_req),
         landmark=COALESCE(?,landmark), notes=COALESCE(?,notes), status=COALESCE(?,status)
       WHERE id=? AND parent_user_id=?`,
      [b.student_name ?? null, b.student_class ?? null, b.board ?? null, b.subject ?? null, b.location ?? null,
       b.mode ?? null, b.preferred_time ?? null, b.time_from ?? null, b.budget ?? null, b.hourly_budget ?? null,
       b.tutor_gender_pref ?? null, b.experience_req ?? null, b.landmark ?? null, b.notes ?? null, b.status ?? null,
       id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating tuition post: ' + err.message });
  }
}

// DELETE /api/parent-tuitions/:id — remove one of the parent's own posts (frees a slot)
async function deleteMyTuition(req, res) {
  try {
    await ensureParentTuitionsTable();
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid post id.' });
    await db.query('DELETE FROM parent_tuitions WHERE id = ? AND parent_user_id = ?', [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting tuition post: ' + err.message });
  }
}

module.exports = { ensureParentTuitionsTable, listMyTuitions, createMyTuition, updateMyTuition, deleteMyTuition };
