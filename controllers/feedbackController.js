'use strict';
const db = require('../config/db');

// Ensure the feedback table exists (runs once when this module is first loaded)
async function ensureTable() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(150),
      phone       VARCHAR(30),
      email       VARCHAR(190),
      page        VARCHAR(190),
      category    VARCHAR(50),
      message     TEXT NOT NULL,
      screenshot  VARCHAR(255),
      user_agent  VARCHAR(500),
      status      VARCHAR(20) DEFAULT 'New',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // Add phone column if upgrading an older feedback table
    try { await db.query('ALTER TABLE feedback ADD COLUMN phone VARCHAR(30) AFTER name'); } catch (e) { /* column already exists */ }
    console.log('\u2705  Feedback table ready');
  } catch (err) {
    console.error('\u26A0\uFE0F  Feedback table:', err.message);
  }
}
ensureTable();

// POST /api/feedback  (public) — store a feedback / error report
async function createFeedback(req, res) {
  try {
    const { name, phone, email, page, category, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Please enter a message.' });
    }
    const screenshot = req.file ? `/uploads/feedback/${req.file.filename}` : null;
    const ua = (req.headers['user-agent'] || '').slice(0, 500);

    await db.query(
      `INSERT INTO feedback (name, phone, email, page, category, message, screenshot, user_agent)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        (name || '').slice(0, 150) || null,
        (phone || '').slice(0, 30) || null,
        (email || '').slice(0, 190) || null,
        (page || '').slice(0, 190) || null,
        (category || '').slice(0, 50) || null,
        message.trim(),
        screenshot,
        ua,
      ]
    );

    res.status(201).json({ message: 'Thanks! Your feedback has been recorded.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not save feedback: ' + err.message });
  }
}

// GET /api/feedback  (admin only) — view submitted feedback
async function listFeedback(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedback: ' + err.message });
  }
}

module.exports = { createFeedback, listFeedback };
