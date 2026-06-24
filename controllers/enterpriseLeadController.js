'use strict';
const db = require('../config/db');

// Ensure the enterprise_leads table exists (runs once when this module is first loaded)
async function ensureTable() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS enterprise_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      school_name     VARCHAR(190) NOT NULL,
      contact_person  VARCHAR(150),
      phone           VARCHAR(30)  NOT NULL,
      email           VARCHAR(190) NOT NULL,
      num_schools     VARCHAR(50),
      message         TEXT,
      plan            VARCHAR(80),
      status          VARCHAR(20) DEFAULT 'New',
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('\u2705  Enterprise leads table ready');
  } catch (err) {
    console.error('\u26A0\uFE0F  Enterprise leads table:', err.message);
  }
}
ensureTable();

// POST /api/contact-sales  (public) — store an enterprise "Contact Sales" enquiry
async function createLead(req, res) {
  try {
    const { school_name, contact_person, phone, email, num_schools, message, plan } = req.body;

    if (!school_name || !school_name.trim()) return res.status(400).json({ message: 'Please enter the school / group name.' });
    if (!phone || !phone.trim())             return res.status(400).json({ message: 'Please enter a mobile number.' });
    if (!email || !email.trim())             return res.status(400).json({ message: 'Please enter an email id.' });

    await db.query(
      `INSERT INTO enterprise_leads (school_name, contact_person, phone, email, num_schools, message, plan)
       VALUES (?,?,?,?,?,?,?)`,
      [
        school_name.trim().slice(0, 190),
        (contact_person || '').slice(0, 150) || null,
        phone.trim().slice(0, 30),
        email.trim().slice(0, 190),
        (num_schools || '').slice(0, 50) || null,
        (message || '').slice(0, 2000) || null,
        (plan || '').slice(0, 80) || null,
      ]
    );

    res.status(201).json({ message: 'Thanks! Our team will contact you shortly.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not submit your request: ' + err.message });
  }
}

// GET /api/contact-sales  (admin only) — view submitted enterprise leads
async function listLeads(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM enterprise_leads ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching leads: ' + err.message });
  }
}

module.exports = { createLead, listLeads };
