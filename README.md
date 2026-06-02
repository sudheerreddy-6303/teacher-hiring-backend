# AcadHr Backend — Setup Guide

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your MySQL credentials and Gmail App Password.

### 3. Set up MySQL database
```bash
mysql -u root -p < schema.sql
```

### 4. Create the admin user
Run this SQL once after the schema is created:
```sql
USE acadhr;
INSERT INTO users (name, email, password, role, is_email_verified)
VALUES (
  'AcadHr Admin',
  'admin@acadhr.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniRCvKHmVnBDEL5p0p.cMzJYi',
  'admin',
  1
);
-- Password is: admin123
-- Change it after first login!
```

### 5. Start the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

---

## Email Setup (Gmail)

1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to Security → App Passwords
4. Generate an app password for "Mail"
5. Put that 16-character password in `.env` as `EMAIL_PASS`

---

## API Reference

### Auth Flow

#### Signup (3 steps)
| Step | Call | Purpose |
|------|------|---------|
| 1 | `POST /api/auth/send-signup-otp` | Send OTP to email |
| 2 | User enters OTP on frontend | — |
| 3 | `POST /api/auth/signup` | Create account (includes OTP) |

#### Login (2 steps)
| Step | Call | Purpose |
|------|------|---------|
| 1 | `POST /api/auth/send-login-otp` | Verify credentials + send OTP |
| 2 | `POST /api/auth/verify-login-otp` | Submit OTP → receive JWT |

---

### Endpoints

#### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/send-signup-otp` | — | Send OTP before signup |
| POST | `/api/auth/signup` | — | Create account (with OTP) |
| POST | `/api/auth/send-login-otp` | — | Step 1 of login |
| POST | `/api/auth/verify-login-otp` | — | Step 2 of login → JWT |
| POST | `/api/auth/resend-otp` | — | Resend OTP |
| GET  | `/api/auth/me` | JWT | Get current user |

#### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/profile` | JWT | Get profile + role details |
| PATCH  | `/api/profile` | JWT | Update profile |

#### Jobs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/jobs` | — | List approved jobs (with filters) |
| GET    | `/api/jobs/:id` | — | Single job detail |
| POST   | `/api/jobs` | school | Post a new job |
| GET    | `/api/my-jobs` | school | School's own jobs |

#### Applications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | `/api/applications` | teacher | Apply to a job |
| GET    | `/api/my-applications` | teacher | Teacher's applications |
| GET    | `/api/job-applicants/:jobId` | school | Applicants for a job |
| PATCH  | `/api/applications/:id` | school | Update status (shortlist/reject/hire) |

#### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/admin/stats` | admin | Dashboard numbers |
| GET    | `/api/admin/users` | admin | All users |
| GET    | `/api/admin/pending-jobs` | admin | Jobs awaiting review |
| PATCH  | `/api/admin/jobs/:id` | admin | Approve or reject job |
| PATCH  | `/api/admin/users/:id/toggle` | admin | Activate / deactivate user |

---

## Frontend Integration

Replace the demo OTP in `AuthPage` with real API calls:

```js
// Send signup OTP
const res = await fetch('http://localhost:5000/api/auth/send-signup-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: form.name, email: form.email, role: form.role })
});

// Create account
const res = await fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...form, otp: otpInput.join('') })
});
const data = await res.json();
// data.token  → store in localStorage
// data.user   → { id, name, email, role }

// Send login OTP
await fetch('http://localhost:5000/api/auth/send-login-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Verify login OTP → get JWT
const res = await fetch('http://localhost:5000/api/auth/verify-login-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, otp: otpInput.join('') })
});
```
