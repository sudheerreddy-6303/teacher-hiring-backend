'use strict';
const db = require('../config/db');

async function generateRequirementId() {
  const year = new Date().getFullYear();
  await db.query(
    `CREATE TABLE IF NOT EXISTS req_id_sequence (
       id   INT AUTO_INCREMENT PRIMARY KEY,
       year SMALLINT NOT NULL,
       seq  INT NOT NULL DEFAULT 0,
       UNIQUE KEY uq_year (year)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ).catch(() => {});

  await db.query(
    `INSERT INTO req_id_sequence (year, seq) VALUES (?, 1)
     ON DUPLICATE KEY UPDATE seq = seq + 1`,
    [year]
  );
  const [[row]] = await db.query(
    'SELECT seq FROM req_id_sequence WHERE year = ?', [year]
  );
  return `REQ-${year}-${String(row.seq).padStart(5, '0')}`;
}

module.exports = { generateRequirementId };
