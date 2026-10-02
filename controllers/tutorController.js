'use strict';
// ── Tutor controller (ADDED — new file, nothing replaced) ────────────────────
// Powers the "Tuitions Database" tab in the tutor dashboard:
//   • list all open tuition requirements posted by parents
//   • let a tutor apply to a tuition (one application per tutor per tuition)
//   • list the tuitions this tutor has already applied to

const db = require('../config/db');
const { saveBlob } = require('./fileController'); // ADDED: store uploaded video bytes in file_blobs

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
    // CHANGED (additive): also include the parent's EXTRA tuition posts
    // (parent_tuitions) alongside their primary requirement. Falls back to the
    // original query if that table doesn't exist yet, so nothing breaks.
    let rows;
    try {
      [rows] = await db.query(`
        SELECT u.id, u.name, u.city AS user_city, u.created_at,
               p.student_class, p.board, p.subject, p.location, p.mode,
               p.preferred_time, p.budget, p.tutor_gender_pref, p.experience_req, p.status, p.notes
        FROM parents p JOIN users u ON u.id = p.user_id
        WHERE u.role='parent' AND u.is_active=1
          AND (p.status IS NULL OR p.status <> 'Closed')
        UNION ALL
        SELECT u.id, u.name, u.city AS user_city, pt.created_at,
               pt.student_class, pt.board, pt.subject, pt.location, pt.mode,
               pt.preferred_time, pt.budget, pt.tutor_gender_pref, pt.experience_req, pt.status, pt.notes
        FROM parent_tuitions pt JOIN users u ON u.id = pt.parent_user_id
        WHERE u.role='parent' AND u.is_active=1
          AND (pt.status IS NULL OR pt.status <> 'Closed')
        ORDER BY created_at DESC
      `);
    } catch (e) {
      [rows] = await db.query(`
        SELECT u.id, u.name, u.city AS user_city, u.created_at,
               p.student_class, p.board, p.subject, p.location, p.mode,
               p.preferred_time, p.budget, p.tutor_gender_pref, p.experience_req, p.status, p.notes
        FROM parents p JOIN users u ON u.id = p.user_id
        WHERE u.role='parent' AND u.is_active=1
          AND (p.status IS NULL OR p.status <> 'Closed')
        ORDER BY u.created_at DESC
      `);
    }
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

    // Re-applying to the same tuition costs nothing
    const [[existing]] = await db.query(
      'SELECT id FROM tuition_applications WHERE tutor_user_id = ? AND parent_user_id = ?',
      [req.user.id, parentId]
    );
    if (existing) {
      return res.json({ message: 'You have already applied to this tuition.', already: true });
    }

    // ── Credits: applying to a tuition costs 1 credit ──────────────────────────
    // If the credits column isn't ready yet, skip enforcement rather than block.
    let credits = null;
    try {
      const [[row]] = await db.query('SELECT COALESCE(credits,0) AS credits FROM users WHERE id = ?', [req.user.id]);
      credits = row ? Number(row.credits) : 0;
    } catch (e) { credits = null; }
    if (credits !== null && credits < 1) {
      return res.status(402).json({ message: 'You need at least 1 credit to apply. Please buy a plan from the Pricing tab to add credits.' });
    }

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

    // Deduct 1 credit for this new application (never below 0)
    let creditsLeft;
    if (credits !== null) {
      try {
        await db.query('UPDATE users SET credits = GREATEST(COALESCE(credits,0) - 1, 0) WHERE id = ?', [req.user.id]);
        creditsLeft = Math.max(credits - 1, 0);
      } catch (e) {}
    }

    res.status(201).json({ message: 'Applied successfully! The parent/admin will contact you.', applied: true, credits_left: creditsLeft });
  } catch (err) { res.status(500).json({ message: 'Error applying: ' + err.message }); }
}

// ADDED: GET /api/tutor/my-tuition-applicants — the tutors who applied to the
// logged-in PARENT's tuition requirement, with their profile + contact details.
// (Parent-auth. Nothing else touched.)
async function tuitionApplicants(req, res) {
  try {
    await ensureApplicationsTable();
    const [rows] = await db.query(
      `SELECT a.id, a.status, a.created_at,
              u.id AS tutor_id, u.name, u.email, u.phone, u.city,
              t.subject, t.subjects, t.experience, t.qualification, t.qualifications,
              t.teaching_mode, t.hourly_rate, t.location, t.gender, t.classes_taught, t.bio,
              t.availability, t.resume_link, t.resume_file_name
         FROM tuition_applications a
         JOIN users u   ON u.id = a.tutor_user_id
         LEFT JOIN tutors t ON t.user_id = a.tutor_user_id
        WHERE a.parent_user_id = ?
        ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    // If the applications table doesn't exist yet, just return an empty list.
    res.json([]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDED: My Videos — a tutor can add intro/demo videos as a link OR by uploading
// a video file, and see all the videos they've added before.
//   • links  → stored as-is in tutor_videos.url
//   • files  → bytes go into file_blobs (like photo/resume), url points at
//              /uploads/videos/<filename> which fileRoutes serves from the DB
// ═══════════════════════════════════════════════════════════════════════════
let _videosTableReady = false;
async function ensureVideosTable() {
  if (_videosTableReady) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tutor_videos (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        title      VARCHAR(300),
        source     VARCHAR(10) NOT NULL DEFAULT 'link',
        url        VARCHAR(1000),
        filename   VARCHAR(300),
        mimetype   VARCHAR(120),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tutor_videos_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    _videosTableReady = true;
  } catch (e) { console.error('[ensureVideosTable]', e.message); }
}

// GET /api/tutor/videos — all videos this tutor has added (newest first)
async function listVideos(req, res) {
  try {
    await ensureVideosTable();
    const [rows] = await db.query(
      'SELECT id, title, source, url, filename, mimetype, created_at FROM tutor_videos WHERE user_id = ? ORDER BY created_at DESC, id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error fetching videos: ' + err.message }); }
}

// POST /api/tutor/videos — add a video (link or uploaded file)
//   Link:  { title?, url }
//   File:  { title?, video_base64, video_name, video_type }
async function addVideo(req, res) {
  try {
    await ensureVideosTable();
    const { title, url, video_base64, video_name, video_type } = req.body || {};

    if (video_base64) {
      // ── Uploaded file ──────────────────────────────────────────────────
      let buf;
      try {
        buf = Buffer.from(String(video_base64).replace(/^data:[^;]+;base64,/, ''), 'base64');
      } catch (e) { return res.status(400).json({ message: 'Could not read the video file.' }); }
      if (!buf || !buf.length) return res.status(400).json({ message: 'The video file is empty.' });

      const safe     = (video_name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `tutorvideo_${req.user.id}_${Date.now()}_${safe}`;
      // kind=null so saveBlob does NOT delete the tutor's earlier videos (they share no kind);
      // each video is keyed by its unique filename instead.
      await saveBlob(req.user.id, null, filename, video_type || 'video/mp4', buf);

      const [r] = await db.query(
        'INSERT INTO tutor_videos (user_id, title, source, url, filename, mimetype) VALUES (?,?,?,?,?,?)',
        [req.user.id, (title || video_name || 'Untitled video').slice(0, 300), 'file',
         `/uploads/videos/${filename}`, filename, video_type || 'video/mp4']
      );
      const [[row]] = await db.query('SELECT id, title, source, url, filename, mimetype, created_at FROM tutor_videos WHERE id = ?', [r.insertId]);
      return res.status(201).json({ message: 'Video uploaded.', video: row });
    }

    // ── Link ───────────────────────────────────────────────────────────────
    const link = String(url || '').trim();
    if (!link) return res.status(400).json({ message: 'Please provide a video link or choose a file.' });
    if (!/^https?:\/\//i.test(link)) return res.status(400).json({ message: 'Video link must start with http:// or https://' });

    const [r] = await db.query(
      'INSERT INTO tutor_videos (user_id, title, source, url) VALUES (?,?,?,?)',
      [req.user.id, (title || 'Untitled video').slice(0, 300), 'link', link.slice(0, 1000)]
    );
    const [[row]] = await db.query('SELECT id, title, source, url, filename, mimetype, created_at FROM tutor_videos WHERE id = ?', [r.insertId]);
    res.status(201).json({ message: 'Video added.', video: row });
  } catch (err) { res.status(500).json({ message: 'Error adding video: ' + err.message }); }
}

// DELETE /api/tutor/videos/:id — remove one of the tutor's own videos
async function deleteVideo(req, res) {
  try {
    await ensureVideosTable();
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid video id.' });

    const [[row]] = await db.query('SELECT id, source, filename FROM tutor_videos WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!row) return res.status(404).json({ message: 'Video not found.' });

    await db.query('DELETE FROM tutor_videos WHERE id = ? AND user_id = ?', [id, req.user.id]);
    // Uploaded files also have their bytes in file_blobs — drop those too.
    if (row.source === 'file' && row.filename) {
      try { await db.query('DELETE FROM file_blobs WHERE filename = ?', [row.filename]); } catch (e) { /* ignore */ }
    }
    res.json({ message: 'Video removed.', id });
  } catch (err) { res.status(500).json({ message: 'Error removing video: ' + err.message }); }
}

module.exports = { listTuitions, myTuitionApplications, applyTuition, tuitionApplicants, listVideos, addVideo, deleteVideo };
