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
});

// Log connection errors
db.on('connection', () => console.log('✅  MySQL connected'));

module.exports = db;
