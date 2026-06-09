'use strict';
const db            = require('../config/db');
const { uploadPhoto, uploadResume, uploadPhotoMem, uploadResumeMem } = require('../config/multer');
const { saveBlob } = require('./fileController');

// GET /api/teacher/profile
async function getProfile(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM teachers WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Teacher profile not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[teacher/profile GET]', err);
    res.status(500).json({ message: 'Error fetching profile: ' + err.message });
  }
}

// PATCH /api/teacher/profile
async function updateProfile(req, res) {
  try {
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
    const dateFields = ['dob', 'available_from'];
    const sanitize = (field, val) => {
      if (val === undefined || val === '' || val === null) return null;
      // Strip ISO datetime to DATE only: "2001-04-07T18:30:00.000Z" → "2001-04-07"
      if (dateFields.includes(field) && typeof val === 'string' && val.includes('T')) {
        return val.split('T')[0];
      }
      return val;
    };

    if (req.body.full_name) {
      await db.query('UPDATE users SET name = ? WHERE id = ?', [req.body.full_name, req.user.id]);
    }

    const setClauses = fields.map(f => `\`${f}\` = ?`).join(', ');
    const values     = fields.map(f => sanitize(f, req.body[f]));
    values.push(req.user.id);

    const [result] = await db.query(
      `UPDATE teachers SET ${setClauses} WHERE user_id = ?`, values
    );

    if (result.affectedRows === 0) {
      const insertFields = ['user_id', ...fields];
      const insertVals   = [req.user.id, ...fields.map(f => sanitize(f, req.body[f]))];
      await db.query(
        `INSERT INTO teachers (${insertFields.map(f => `\`${f}\``).join(', ')})
         VALUES (${insertFields.map(() => '?').join(', ')})`,
        insertVals
      );
    }

    res.json({ message: 'Profile saved.', completion_pct: req.body.completion_pct || 0 });
  } catch (err) {
    console.error('[teacher/profile PATCH]', err);
    res.status(500).json({ message: 'Error saving profile: ' + err.message });
  }
}

// POST /api/teacher/upload-photo
function uploadPhotoHandler(req, res) {
  uploadPhotoMem(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
      const ext      = (req.file.originalname.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0].toLowerCase();
      const filename = `teacher_${req.user.id}_${Date.now()}${ext}`;
      const photoUrl = `/uploads/photos/${filename}`;
      // Store the image bytes in the database so it survives deploys
      await saveBlob(req.user.id, 'photo', filename, req.file.mimetype, req.file.buffer);
      // Upsert — update if row exists, insert if new teacher
      const [result] = await db.query(
        'UPDATE teachers SET profile_photo = ? WHERE user_id = ?',
        [photoUrl, req.user.id]
      );
      if (result.affectedRows === 0) {
        await db.query(
          'INSERT INTO teachers (user_id, profile_photo) VALUES (?, ?)',
          [req.user.id, photoUrl]
        );
      }
      res.json({ message: 'Photo uploaded.', photo_url: photoUrl });
    } catch (e) {
      console.error('[upload-photo]', e);
      res.status(500).json({ message: 'Upload failed: ' + e.message });
    }
  });
}

// GET /api/profile  (general — all roles)
async function getGeneralProfile(req, res) {
  try {
    const [[user]] = await db.query(
      'SELECT id,name,email,role,city,phone,is_active FROM users WHERE id = ?', [req.user.id]
    );
    let profile = {};
    if (user.role === 'teacher') { const [r] = await db.query('SELECT * FROM teachers WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    else if (user.role === 'tutor')  { const [r] = await db.query('SELECT * FROM tutors  WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    else if (user.role === 'school') { const [r] = await db.query('SELECT * FROM schools WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    else if (user.role === 'parent') { const [r] = await db.query('SELECT * FROM parents WHERE user_id = ?', [user.id]); profile = r[0] || {}; }
    res.json({ user, profile });
  } catch (err) { res.status(500).json({ message: 'Error fetching profile.' }); }
}

// PATCH /api/profile  (general — all roles)
async function updateGeneralProfile(req, res) {
  try {
    const role = req.user.role;
    if (req.body.name) await db.query('UPDATE users SET name=?,city=?,phone=? WHERE id=?', [req.body.name, req.body.city||null, req.body.phone||null, req.user.id]);
    if (role === 'tutor') {
      const { subject, experience, qualification, bio, hourly_rate, teaching_mode } = req.body;
      await db.query('UPDATE tutors SET subject=COALESCE(?,subject), experience=COALESCE(?,experience), qualification=COALESCE(?,qualification), bio=COALESCE(?,bio), hourly_rate=COALESCE(?,hourly_rate), teaching_mode=COALESCE(?,teaching_mode) WHERE user_id=?',
        [subject||null, experience||null, qualification||null, bio||null, hourly_rate||null, teaching_mode||null, req.user.id]);
    } else if (role === 'school') {
      const { institute_type, est_year, student_count, website } = req.body;
      await db.query('UPDATE schools SET institute_type=COALESCE(?,institute_type), est_year=COALESCE(?,est_year), student_count=COALESCE(?,student_count), website=COALESCE(?,website) WHERE user_id=?',
        [institute_type||null, est_year||null, student_count||null, website||null, req.user.id]);
    } else if (role === 'parent') {
      const { student_name, student_class, board, subject, location, mode, preferred_time, budget, tutor_gender_pref, experience_req, notes } = req.body;
      await db.query(
        `UPDATE parents SET student_name=COALESCE(?,student_name), student_class=COALESCE(?,student_class),
          board=COALESCE(?,board), subject=COALESCE(?,subject), location=COALESCE(?,location),
          mode=COALESCE(?,mode), preferred_time=COALESCE(?,preferred_time), budget=COALESCE(?,budget),
          tutor_gender_pref=COALESCE(?,tutor_gender_pref), experience_req=COALESCE(?,experience_req),
          notes=COALESCE(?,notes) WHERE user_id=?`,
        [student_name||null, student_class||null, board||null, subject||null, location||null,
         mode||null, preferred_time||null, budget||null, tutor_gender_pref||null, experience_req||null, notes||null, req.user.id]
      );
    }
    res.json({ message: 'Profile updated.' });
  } catch (err) { res.status(500).json({ message: 'Error updating profile.' }); }
}

// POST /api/teacher/upload-resume
function uploadResumeHandler(req, res) {
  uploadResumeMem(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
      const ext        = (req.file.originalname.match(/\.[a-z0-9]+$/i) || ['.pdf'])[0].toLowerCase();
      const filename   = `resume_${req.user.id}_${Date.now()}${ext}`;
      const resumeUrl  = `/uploads/resumes/${filename}`;
      const resumeName = req.file.originalname;
      // Store the resume bytes in the database so it survives deploys
      await saveBlob(req.user.id, 'resume', filename, req.file.mimetype, req.file.buffer);
      // Upsert — update if row exists, insert if new teacher
      const [result] = await db.query(
        'UPDATE teachers SET resume_link = ?, resume_file_name = ? WHERE user_id = ?',
        [resumeUrl, resumeName, req.user.id]
      );
      if (result.affectedRows === 0) {
        await db.query(
          'INSERT INTO teachers (user_id, resume_link, resume_file_name) VALUES (?, ?, ?)',
          [req.user.id, resumeUrl, resumeName]
        );
      }
      res.json({ message: 'Resume uploaded.', resume_link: resumeUrl, resume_file_name: resumeName });
    } catch (e) {
      console.error('[upload-resume]', e);
      res.status(500).json({ message: 'Upload failed: ' + e.message });
    }
  });
}

module.exports = { getProfile, updateProfile, uploadPhotoHandler, uploadResumeHandler, getGeneralProfile, updateGeneralProfile };
