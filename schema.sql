-- ─── AcadHr Database Schema ───────────────────────────────────────────────────
-- Run this file once to set up your database:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS acadhr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE acadhr;

-- ── Users (all roles share this table) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL,
  role            ENUM('teacher','tutor','school','admin','parent') NOT NULL,
  phone           VARCHAR(20),
  city            VARCHAR(100),
  is_email_verified TINYINT(1)  DEFAULT 0,
  is_active       TINYINT(1)    DEFAULT 1,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── OTP Store (signup + login verification) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  otp        VARCHAR(10)  NOT NULL,
  type       VARCHAR(20)  NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_type (email, type)
);

-- ── Teacher profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  subject       VARCHAR(100),
  experience    VARCHAR(50),
  qualification VARCHAR(100),
  bio           TEXT,
  resume_url    VARCHAR(500),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Tutor profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutors (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  subject       VARCHAR(100),
  experience    VARCHAR(50),
  qualification VARCHAR(100),
  hourly_rate   VARCHAR(50),
  teaching_mode ENUM('Online','Offline','Both') DEFAULT 'Both',
  bio           TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── School / Institute profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  institute_name  VARCHAR(200),
  institute_type  VARCHAR(100),
  est_year        INT,
  student_count   VARCHAR(50),
  website         VARCHAR(300),
  is_verified     TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Jobs (extended with full requirement details) ─────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                  INT AUTO_INCREMENT PRIMARY KEY,

  -- Auto-generated unique requirement ID (e.g. REQ-2025-00042)
  requirement_id      VARCHAR(30)   NOT NULL UNIQUE,

  -- Institution details
  institution_name    VARCHAR(200),
  institution_type    VARCHAR(100),
  location_state      VARCHAR(100),
  location_city       VARCHAR(100),
  contact_person      VARCHAR(150),
  contact_number      VARCHAR(20),
  contact_email       VARCHAR(255),

  -- Requirement details
  requirement_type    ENUM('Teacher','Faculty','Tutor') DEFAULT 'Teacher',
  title               VARCHAR(200)  NOT NULL,
  subject             VARCHAR(100),
  grades              VARCHAR(300),   -- stored as comma-separated e.g. "Grade 9–10,Grade 11–12"
  board               VARCHAR(100),
  experience          VARCHAR(100),

  -- Compensation & schedule
  job_type            VARCHAR(50)   DEFAULT 'Full-time',
  salary_min          DECIMAL(10,2),
  salary_max          DECIMAL(10,2),
  joining_timeline    VARCHAR(50)   DEFAULT 'Immediate',
  work_mode           VARCHAR(50)   DEFAULT 'Full-time',

  -- Conditions
  residential         ENUM('Yes','No')           DEFAULT 'No',
  accommodation       VARCHAR(50)               DEFAULT 'Not Provided',
  gender_preference   VARCHAR(50)               DEFAULT 'No Preference',
  interview_mode      VARCHAR(50)               DEFAULT 'Online',
  demo_required       ENUM('Yes','No')           DEFAULT 'No',
  positions           INT                       DEFAULT 1,

  -- Internal / admin
  description         TEXT,
  notes               TEXT,
  assigned_recruiter  VARCHAR(150),
  status              ENUM('pending','approved','rejected','Open','Closed') DEFAULT 'pending',
  posted_by           INT NOT NULL,
  reviewed_by         INT,
  reviewed_at         DATETIME,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (posted_by)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ── Sequence counter for Requirement IDs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS req_id_sequence (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  year      SMALLINT NOT NULL,
  seq       INT      NOT NULL DEFAULT 0,
  UNIQUE KEY uq_year (year)
);

-- ── Applications ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  job_id       INT NOT NULL,
  teacher_id   INT NOT NULL,
  cover_letter TEXT,
  status       ENUM('pending','shortlisted','rejected','hired') DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (job_id, teacher_id),
  FOREIGN KEY (job_id)     REFERENCES jobs(id)  ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Default admin user (password: admin123) ───────────────────────────────────
-- Run separately after setup to create the admin account:
-- INSERT INTO users (name, email, password, role, is_email_verified)
-- VALUES ('AcadHr Admin', 'admin@acadhr.com',
--   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);
