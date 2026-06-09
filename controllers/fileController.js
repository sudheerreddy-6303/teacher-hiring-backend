'use strict';
const db = require('../config/db');

// Ensure the blob table exists (runs once when this module is first loaded)
async function ensureTable() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS file_blobs (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT,
      kind       VARCHAR(20),
      filename   VARCHAR(300) NOT NULL UNIQUE,
      mimetype   VARCHAR(120),
      data       LONGBLOB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('\u2705  File blobs table ready');
  } catch (err) {
    console.error('\u26A0\uFE0F  file_blobs table:', err.message);
  }
}
ensureTable();

// Store a file's bytes in the database (one per user+kind — old one is replaced)
async function saveBlob(userId, kind, filename, mimetype, buffer) {
  if (userId != null && kind) {
    try { await db.query('DELETE FROM file_blobs WHERE user_id=? AND kind=?', [userId, kind]); } catch (e) { /* ignore */ }
  }
  await db.query(
    `INSERT INTO file_blobs (user_id, kind, filename, mimetype, data)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), kind=VALUES(kind),
       mimetype=VALUES(mimetype), data=VALUES(data), created_at=CURRENT_TIMESTAMP`,
    [userId == null ? null : userId, kind || null, filename, mimetype || null, buffer]
  );
}

// GET /uploads/photos/:filename  or  /uploads/resumes/:filename
// Serves the file from the database when it isn't present on disk.
async function serveByFilename(req, res) {
  try {
    const { filename } = req.params;
    const [rows] = await db.query('SELECT filename, mimetype, data FROM file_blobs WHERE filename=?', [filename]);
    if (!rows.length || !rows[0].data) return res.status(404).json({ message: 'File not found.' });
    const f = rows[0];
    const safe = (f.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', f.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safe}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(f.data); // Buffer → binary response
  } catch (err) {
    res.status(500).json({ message: 'Error serving file: ' + err.message });
  }
}

module.exports = { saveBlob, serveByFilename, ensureTable };
