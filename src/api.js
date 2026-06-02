// ─── AcadHr API Service ───────────────────────────────────────────────────────
// All backend calls go through this file.
// Token is stored in localStorage under 'acadhr_token'.

const BASE_URL = process.env.REACT_APP_API_URL || 'https://teacher-hiring-backend.onrender.com/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken()         { return localStorage.getItem('acadhr_token'); }
export function setToken(token)    { localStorage.setItem('acadhr_token', token); }
export function removeToken()      { localStorage.removeItem('acadhr_token'); }

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body = null, authRequired = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (authRequired) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH API
// ═════════════════════════════════════════════════════════════════════════════
export const authAPI = {
  // Signup flow
  sendSignupOtp: (name, email, role) =>
    request('POST', '/auth/send-signup-otp', { name, email, role }),

  signup: (payload) =>
    request('POST', '/auth/signup', payload),

  // Login flow
  sendLoginOtp: (email, password) =>
    request('POST', '/auth/send-login-otp', { email, password }),

  verifyLoginOtp: (email, otp) =>
    request('POST', '/auth/verify-login-otp', { email, otp }),

  // Resend OTP (type: 'signup' | 'login')
  resendOtp: (email, name, type) =>
    request('POST', '/auth/resend-otp', { email, name, type }),

  // Get current user from token
  me: () => request('GET', '/auth/me', null, true),
};

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE API
// ═════════════════════════════════════════════════════════════════════════════
export const profileAPI = {
  get:    ()        => request('GET',   '/profile',  null,    true),
  update: (payload) => request('PATCH', '/profile',  payload, true),
};

// ═════════════════════════════════════════════════════════════════════════════
// JOBS API
// ═════════════════════════════════════════════════════════════════════════════
export const jobsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request('GET', `/jobs${qs ? '?' + qs : ''}`);
  },
  getOne:   (id)      => request('GET',  `/jobs/${id}`),
  post:     (payload) => request('POST', '/jobs',     payload, true),
  getMyJobs: ()       => request('GET',  '/my-jobs',  null,    true),
};

// ═════════════════════════════════════════════════════════════════════════════
// APPLICATIONS API
// ═════════════════════════════════════════════════════════════════════════════
export const applicationsAPI = {
  apply:          (payload)    => request('POST',  '/applications',          payload,  true),
  myApplications: ()           => request('GET',   '/my-applications',       null,     true),
  getApplicants:  (jobId)      => request('GET',   `/job-applicants/${jobId}`,null,    true),
  updateStatus:   (id, status) => request('PATCH', `/applications/${id}`,   { status }, true),
};

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN API
// ═════════════════════════════════════════════════════════════════════════════
export const adminAPI = {
  stats:       ()           => request('GET',   '/admin/stats',              null,     true),
  users:       ()           => request('GET',   '/admin/users',              null,     true),
  toggleUser:  (id)         => request('PATCH', `/admin/users/${id}/toggle`, null,     true),
  pendingJobs: ()           => request('GET',   '/admin/pending-jobs',       null,     true),
  reviewJob:   (id, action) => request('PATCH', `/admin/jobs/${id}`,         { action }, true),
};
