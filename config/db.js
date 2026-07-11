'use strict';
const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  // Support both custom DB_* vars and Railway's native MYSQL* vars
  host:               process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
  port:               Number(process.env.DB_PORT || process.env.MYSQLPORT)  || 3306,
  user:               process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
  password:           process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database:           process.env.DB_NAME     || process.env.MYSQLDATABASE || 'acadhr',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+05:30',
  connectTimeout:     30000,      // 30s timeout for Railway cold starts
  ssl:                process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  // ── ADDED (fix #3): overnight idle-disconnect protection ──────────────────
  enableKeepAlive:       true,    // TCP keep-alive so idle connections aren't silently dropped
  keepAliveInitialDelay: 10000,   // start keep-alive pings 10s after connect
  maxIdle:               2,       // keep at most 2 idle connections overnight
  idleTimeout:           60000,   // retire connections idle >60s (before MySQL/Railway kills them)
  // ── END ADDED ──────────────────────────────────────────────────────────────
});

// Log connection errors
db.on('connection', () => console.log('✅  MySQL connected'));

// ── ADDED (fix #3): log pool-level errors instead of failing silently ────────
db.on('error', (err) => console.error('❌  MySQL pool error:', err.code, err.message));
// ── END ADDED ─────────────────────────────────────────────────────────────────

module.exports = db;
