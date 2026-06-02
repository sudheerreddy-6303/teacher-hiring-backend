'use strict';
const db                     = require('../config/db');
const { generateRequirementId } = require('../utils/reqId');

// GET /api/jobs
async function listJobs(req, res) {
  try {
    const { subject, type, location, search } = req.query;

    // Query acadhr.jobs with exact column names from schema
    let q = `
      SELECT
        j.id,
        j.requirement_id,
        j.institution_name,
        j.institution_type,
        j.location_state,
        j.location_city,
        j.contact_person,
        j.contact_number,
        j.contact_email,
        j.requirement_type,
        j.title,
        j.subject,
        j.grades,
        j.board,
        j.experience,
        j.job_type,
        j.salary_min,
        j.salary_max,
        j.joining_timeline,
        j.work_mode,
        j.residential,
        j.accommodation,
        j.gender_preference,
        j.interview_mode,
        j.demo_required,
        j.positions,
        j.description,
        j.status,
        j.posted_by,
        j.created_at,
        u.name  AS posted_by_name,
        u.city  AS posted_by_city,
        u.email AS posted_by_email,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count
      FROM jobs j
      JOIN users u ON j.posted_by = u.id
      WHERE j.status != 'rejected'
    `;
    const p = [];
    if (subject)  { q += ' AND j.subject LIKE ?';                                                   p.push(`%${subject}%`); }
    if (type)     { q += ' AND (j.job_type LIKE ? OR j.work_mode LIKE ?)';                          p.push(`%${type}%`, `%${type}%`); }
    if (location) { q += ' AND (j.location_city LIKE ? OR j.location_state LIKE ?)';                p.push(`%${location}%`, `%${location}%`); }
    if (search)   { q += ' AND (j.title LIKE ? OR j.institution_name LIKE ? OR j.subject LIKE ?)';  p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += ' ORDER BY j.created_at DESC';

    const [jobs] = await db.query(q, p);
    res.json(jobs);
  } catch (err) {
    console.error('[listJobs]', err);
    res.status(500).json({ message: 'Error fetching jobs: ' + err.message });
  }
}

// GET /api/generate-req-id
async function previewReqId(req, res) {
  try {
    const year = new Date().getFullYear();
    const [rows] = await db.query('SELECT seq FROM req_id_sequence WHERE year = ?', [year]);
    const nextSeq = String((rows[0]?.seq || 0) + 1).padStart(5, '0');
    res.json({ requirement_id: `REQ-${year}-${nextSeq}` });
  } catch {
    res.json({ requirement_id: `REQ-${new Date().getFullYear()}-00001` });
  }
}

// GET /api/jobs/:id
async function getJob(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT j.*, u.name AS institute_name, u.city, u.phone AS institute_phone FROM jobs j JOIN users u ON j.posted_by=u.id WHERE j.id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Job not found.' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Error fetching job.' }); }
}

// POST /api/jobs
async function createJob(req, res) {
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

    if (!subject && !title) return res.status(400).json({ message: 'Subject or title required.' });

    const requirement_id = await generateRequirementId();
    const jobTitle = title || `${requirement_type || 'Teacher'} — ${subject}`;
    const gradesStr = Array.isArray(grades) ? grades.join(',') : (grades || '');

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
        requirement_type||'Teacher', jobTitle, subject, gradesStr, board||'CBSE', experience||null,
        job_type||'Full-time', salary_min||null, salary_max||null,
        joining_timeline||'Immediate', work_mode||'Full-time',
        residential||'No', accommodation||'Not Provided',
        gender_preference||'No Preference',
        interview_mode||'Online', demo_required||'No', positions||1,
        description||null, notes||null, assigned_recruiter||null,
        'pending', req.user.id,
      ]
    );

    res.status(201).json({ message: 'Job submitted for review.', jobId: result.insertId, requirement_id });
  } catch (err) {
    console.error('[createJob]', err);
    res.status(500).json({ message: 'Error posting job: ' + err.message });
  }
}

// GET /api/my-jobs
async function myJobs(req, res) {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.id) AS applicant_count
       FROM jobs j WHERE j.posted_by=? ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: 'Error fetching jobs.' }); }
}

// POST /api/jobs/applications
async function applyJob(req, res) {
  try {
    const { job_id, cover_note } = req.body;
    if (!job_id) return res.status(400).json({ message: 'job_id is required.' });

    // Check already applied first
    const [[existing]] = await db.query(
      'SELECT id FROM applications WHERE job_id = ? AND teacher_id = ?',
      [job_id, req.user.id]
    );
    if (existing) return res.status(409).json({ message: 'Already applied to this job.' });

    // Try inserting with cover_note, fallback to cover_letter
    try {
      await db.query(
        'INSERT INTO applications (job_id, teacher_id, cover_note) VALUES (?, ?, ?)',
        [job_id, req.user.id, cover_note || null]
      );
    } catch (colErr) {
      if (colErr.message.includes('cover_note') || colErr.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(
          'INSERT INTO applications (job_id, teacher_id, cover_letter) VALUES (?, ?, ?)',
          [job_id, req.user.id, cover_note || null]
        );
      } else {
        throw colErr;
      }
    }

    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (err) {
    console.error('[applyJob]', err.message);
    // MySQL duplicate entry error = already applied
    if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
      return res.status(409).json({ message: 'Already applied to this job.' });
    }
    res.status(500).json({ message: 'Error submitting application: ' + err.message });
  }
}

// GET /api/my-applications
async function myApplications(req, res) {
  try {
    const [apps] = await db.query(
      `SELECT a.id, a.status, a.created_at, a.cover_note,
              j.id AS job_id, j.title, j.location_city, j.subject, j.institution_name,
              j.salary_min, j.salary_max, j.job_type,
              u.name AS school_name, u.email AS school_email
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON j.posted_by = u.id
       WHERE a.teacher_id = ?
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json(apps);
  } catch (err) { res.status(500).json({ message: 'Error fetching applications.' }); }
}

// GET /api/job-applicants/:jobId
async function jobApplicants(req, res) {
  try {
    const [apps] = await db.query(
      `SELECT a.id, a.status, a.created_at, a.cover_note,
              u.name AS teacher_name, u.email, u.phone, u.city,
              t.subject, t.total_experience AS experience, t.qualification,
              t.completion_pct, t.profile_photo,
              t.resume_link, t.resume_file_name, t.mobile,
              t.specialization, t.current_role, t.languages, t.work_mode
       FROM applications a
       JOIN users u ON a.teacher_id = u.id
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE a.job_id = ?
       ORDER BY a.created_at DESC`,
      [req.params.jobId]
    );
    res.json(apps);
  } catch (err) {
    console.error('[jobApplicants]', err);
    res.status(500).json({ message: 'Error fetching applicants.' });
  }
}

// PATCH /api/applications/:id
async function updateApplication(req, res) {
  try {
    const { status } = req.body;
    await db.query('UPDATE applications SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Application updated.' });
  } catch (err) { res.status(500).json({ message: 'Error updating application.' }); }
}

module.exports = { listJobs, previewReqId, getJob, createJob, myJobs, applyJob, myApplications, jobApplicants, updateApplication };
