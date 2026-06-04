# AcadHr Backend

Node.js + Express REST API for AcadHr Teacher Hiring Platform.

## Deploy on Railway

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/YOUR/acadhr-backend.git
git push -u origin main
```

### 2. Create Railway Service
- Go to railway.app → New Project → Deploy from GitHub
- Select this repo

### 3. Add MySQL Database
- In Railway → New → Database → MySQL
- Variables are auto-injected

### 4. Set Environment Variables
Copy from `.env.example` and fill in values:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST` | From Railway MySQL |
| `DB_PORT` | From Railway MySQL |
| `DB_USER` | From Railway MySQL |
| `DB_PASSWORD` | From Railway MySQL |
| `DB_NAME` | `acadhr` |
| `JWT_SECRET` | Random 64-char string |
| `EMAIL_USER` | Your Gmail |
| `EMAIL_PASS` | Gmail App Password |
| `ALLOWED_ORIGINS` | Your frontend URL |

### 5. Get Your Backend URL
After deploy: `https://acadhr-backend.up.railway.app`

## Admin Credentials
- Email: `acadhire01@gmail.com`
- Password: `acadhire@2026`

## API Health Check
`GET /api/health` → `{"status":"ok"}`
