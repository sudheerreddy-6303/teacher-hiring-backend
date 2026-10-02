'use strict';
// ─── AcadHr Payment Controller (Razorpay) ─────────────────────────────────────
// NEW FILE. This does not change or import any of your existing logic.
// It self-creates its own `payments` table and adds two columns to `users`
// (plan, plan_expires_at) the first time it loads — the same pattern your
// enterpriseLeadController already uses. Nothing existing is modified.
//
// SECURITY: the amount charged is ALWAYS decided here on the server from the
// PLANS map below — never from the browser. And every payment is verified with
// an HMAC signature before a user is marked as paid.

const db     = require('../config/db');
const crypto = require('crypto');

// ──────────────────────────────────────────────────────────────────────────────
// 1. YOUR PLANS  (⚠️ EDIT THESE to exactly match your PricingPage.jsx)
//    - `amount` is in PAISE.  ₹1 = 100 paise.  So ₹2,499 = 249900.
//    - `months` is how long the plan lasts (used to set the expiry date).
//    - Add as many entries as you like. The key (e.g. "school_professional")
//      is the `plan_id` the frontend sends.
// ──────────────────────────────────────────────────────────────────────────────
const PLANS = {
  // ── School plans (shown in the School dashboard → Pricing tab) ──────────────
  //   amount is in PAISE (₹1 = 100). credits = credits added on a successful payment.
  school_basic_1m: { label: 'Basic Recruitment (1 month)',   amount:  499900, months: 1, credits:   50 },
  school_basic_3m: { label: 'Basic Recruitment (3 months)',  amount: 1425000, months: 3, credits:  150 },
  school_basic_6m: { label: 'Basic Recruitment (6 months)',  amount: 2699500, months: 6, credits:  300 },

  school_pro_1m:   { label: 'Professional Hiring (1 month)',  amount: 1500000, months: 1, credits:  200 },
  school_pro_3m:   { label: 'Professional Hiring (3 months)', amount: 4275000, months: 3, credits:  600 },
  school_pro_6m:   { label: 'Professional Hiring (6 months)', amount: 8100000, months: 6, credits: 1200 },

  // ── Teacher plan ───────────────────────────────────────────────────────────
  teacher_pro:     { label: 'Teacher — Pro (1 month)',        amount:   29900, months: 1, credits:   30 },

  // ── Teacher plans (shown in the Teacher dashboard → Pricing tab) ─────────────
  teacher_starter_1m:  { label: 'Starter (1 month)',    amount: 150000, months: 1, credits: 10 },
  teacher_starter_3m:  { label: 'Starter (3 months)',   amount: 405000, months: 3, credits: 30 },
  teacher_premium_1m:  { label: 'Premium (1 month)',    amount: 200000, months: 1, credits: 20 },
  teacher_premium_3m:  { label: 'Premium (3 months)',   amount: 540000, months: 3, credits: 60 },
  teacher_prestige_1m: { label: 'Prestige (1 month)',   amount: 250000, months: 1, credits: 30 },
  teacher_prestige_3m: { label: 'Prestige (3 months)',  amount: 675000, months: 3, credits: 90 },

  // ── Tutor plans (shown in the Tutor dashboard → Pricing tab) ─────────────────
  tutor_inaugural_1m: { label: 'Inaugural Offer (1 month)',   amount: 150000, months: 1, credits:  10 },
  tutor_inaugural_3m: { label: 'Inaugural Offer (3 months)',  amount: 405000, months: 3, credits:  30 },
  tutor_pro_1m:       { label: 'Pro Tutor (1 month)',         amount: 300000, months: 1, credits:  20 },
  tutor_pro_3m:       { label: 'Pro Tutor (3 months)',        amount: 810000, months: 3, credits:  60 },

  // ── Parent plans (shown in the Parent dashboard → Pricing tab) ───────────────
  parent_starter_1m:  { label: 'Starter (1 month)',   amount: 100000, months: 1, credits:  60 },
  parent_starter_3m:  { label: 'Starter (3 months)',  amount: 270000, months: 3, credits: 180 },
  parent_premium_1m:  { label: 'Premium (1 month)',   amount: 200000, months: 1, credits: 100 },
  parent_premium_3m:  { label: 'Premium (3 months)',  amount: 540000, months: 3, credits: 300 },
};

// Public view of the plans (safe to send to the browser — no secrets)
function publicPlans() {
  const out = {};
  for (const [id, p] of Object.entries(PLANS)) {
    out[id] = { label: p.label, amount: p.amount, months: p.months, currency: 'INR', credits: p.credits || 0 };
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// 1b. DB-BACKED PLANS (admin-editable)
//    The `plans` table below is the live source of truth once seeded. The admin
//    can edit prices / credits / features / active from the Admin dashboard, and
//    the pricing pages + the charge both read from it. The hardcoded PLANS map
//    above stays as a safety fallback (used only if a plan_id is missing from DB).
// ──────────────────────────────────────────────────────────────────────────────
// Exact feature lists as shown on the pricing page (loaded into the admin editor).
const PAGE_FEATURES = {
  school_basic: ["Post up to 5 jobs","Faculty Resume Database Access","Candidate Search Filters","Email & WhatsApp Candidate Alerts","School Profile Page","Applicant Tracking Dashboard","Basic Recruitment Reports"],
  school_pro: ["Everything in Basic plus:","Post Up to 10 jobs/month","Dedicated Recruitment Coordinator","Candidate Screening Support","Interview Coordination","Priority Access to Top Faculty","Subject-wise Talent Pool","Principals","Vice Principals","Academic Directors","Coordinators","Featured School Profile","Featured Job Listings"],
  school_enterprise: ["Everything in Professional plus:","Dedicated Recruiter, Single Point of Contact","Monthly Recruitment Planning","Requirement Collection","Demo Classes Scheduling","Joining Tracking","Principals","Vice Principals","Academic Heads","Deans","HODs","Counselors"],
  teacher_starter: ["Apply to up to 10 jobs","Priority profile visibility","Resume building","Access to shortlisted jobs","Regular job alerts"],
  teacher_premium: ["Top priority visibility","Direct interview opportunities from schools","Dedicated profile promotion","Early alerts to high-paying roles"],
  teacher_prestige: ["Dedicated HR for interviews","Profile boosting","Early job alerts"],
  tutor_inaugural: ["Apply to up to 10 profiles","Improved profile visibility","Shortlisted job alerts"],
  tutor_pro: ["Up to 20 job applications","Priority profile shown to parents","Direct recruiter support","Highlighted profile"],
  parent_starter: ["2–3 tuition requests","Access tutor profiles","60 unlock credits"],
  parent_premium: ["4–5 tuition requests","100 unlock credits","Dedicated recruiter support","Demo class scheduling","One month dedicated support"],
};

const SEED = [
  { audience:'school', group_key:'school_basic', name:'Basic Recruitment', tagline:'For single schools getting started', highlight:0, accent:'#1A56DB',
    features:['Post active jobs','Access to teacher database','School profile page','Basic recruitment reports'],
    periods:[
      { plan_id:'school_basic_1m', period_label:'1 month',  amount:499900,  months:1, credits:50,  note:'' },
      { plan_id:'school_basic_3m', period_label:'3 months', amount:1425000, months:3, credits:150, note:'save 5%' },
      { plan_id:'school_basic_6m', period_label:'6 months', amount:2699500, months:6, credits:300, note:'save 10%' },
    ] },
  { audience:'school', group_key:'school_pro', name:'Professional Hiring', tagline:'For active, growing schools', highlight:1, accent:'#1A56DB',
    features:['Everything in Basic','Post up to 10 jobs/month','Featured school profile','Priority support','Advanced reports'],
    periods:[
      { plan_id:'school_pro_1m', period_label:'1 month',  amount:1500000, months:1, credits:200,  note:'' },
      { plan_id:'school_pro_3m', period_label:'3 months', amount:4275000, months:3, credits:600,  note:'save 5%' },
      { plan_id:'school_pro_6m', period_label:'6 months', amount:8100000, months:6, credits:1200, note:'save 10%' },
    ] },
  { audience:'school', group_key:'school_enterprise', name:'Enterprise Chain School', tagline:'For groups with 5+ schools', highlight:0, accent:'#7C3AED', kind:'contact', price_text:'₹25,000 – ₹1,00,000', subtitle:'Ideal for groups with 5+ schools',
    features:['Everything in Professional','Unlimited jobs','Dedicated account manager','Custom integrations'],
    periods:[ { plan_id:'school_enterprise', period_label:'', amount:0, months:1, credits:0, note:'' } ] },
  { audience:'teacher', group_key:'teacher_starter', name:'Starter', tagline:'For teachers getting started', highlight:0, accent:'#1A56DB',
    features:['Apply to up to 10 jobs','Priority profile visibility','Resume building','Access to shortlisted jobs'],
    periods:[
      { plan_id:'teacher_starter_1m', period_label:'1 month',  amount:150000, months:1, credits:10, note:'' },
      { plan_id:'teacher_starter_3m', period_label:'3 months', amount:405000, months:3, credits:30, note:'save 10%' },
    ] },
  { audience:'teacher', group_key:'teacher_premium', name:'Premium', tagline:'Most popular for active teachers', highlight:1, accent:'#4F46E5',
    features:['Top priority visibility','Direct interview opportunities','Dedicated profile promotion','Early alerts to high-paying roles'],
    periods:[
      { plan_id:'teacher_premium_1m', period_label:'1 month',  amount:200000, months:1, credits:20, note:'' },
      { plan_id:'teacher_premium_3m', period_label:'3 months', amount:540000, months:3, credits:60, note:'save 10%' },
    ] },
  { audience:'teacher', group_key:'teacher_prestige', name:'Prestige', tagline:'For leadership roles', highlight:0, accent:'#B45309',
    features:['Dedicated HR for interviews','Profile boosting','Early job alerts'],
    periods:[
      { plan_id:'teacher_prestige_1m', period_label:'1 month',  amount:250000, months:1, credits:30, note:'' },
      { plan_id:'teacher_prestige_3m', period_label:'3 months', amount:675000, months:3, credits:90, note:'save 10%' },
    ] },
  { audience:'tutor', group_key:'tutor_inaugural', name:'Inaugural Offer', tagline:'Great value to get started', highlight:0, accent:'#0E7490',
    features:['Apply to up to 10 profiles','Improved profile visibility','Shortlisted job alerts'],
    periods:[
      { plan_id:'tutor_inaugural_1m', period_label:'1 month',  amount:150000, months:1, credits:10, note:'' },
      { plan_id:'tutor_inaugural_3m', period_label:'3 months', amount:405000, months:3, credits:30, note:'save 10%' },
    ] },
  { audience:'tutor', group_key:'tutor_pro', name:'Pro Tutor', tagline:'For serious, active tutors', highlight:1, accent:'#0E7490',
    features:['Up to 20 job applications','Priority profile shown to parents','Direct recruiter support','Highlighted profile'],
    periods:[
      { plan_id:'tutor_pro_1m', period_label:'1 month',  amount:300000, months:1, credits:20, note:'' },
      { plan_id:'tutor_pro_3m', period_label:'3 months', amount:810000, months:3, credits:60, note:'save 10%' },
    ] },
  { audience:'parent', group_key:'parent_starter', name:'Starter', tagline:'Most popular for parents', highlight:1, accent:'#DB2777',
    features:['2–3 tuition requests','Access tutor profiles','60 unlock credits'],
    periods:[
      { plan_id:'parent_starter_1m', period_label:'1 month',  amount:100000, months:1, credits:60,  note:'' },
      { plan_id:'parent_starter_3m', period_label:'3 months', amount:270000, months:3, credits:180, note:'save 10%' },
    ] },
  { audience:'parent', group_key:'parent_premium', name:'Premium', tagline:'For serious parents', highlight:0, accent:'#7C3AED',
    features:['4–5 tuition requests','100 unlock credits','Dedicated recruiter support','Demo class scheduling','One month dedicated support'],
    periods:[
      { plan_id:'parent_premium_1m', period_label:'1 month',  amount:200000, months:1, credits:100, note:'' },
      { plan_id:'parent_premium_3m', period_label:'3 months', amount:540000, months:3, credits:300, note:'save 10%' },
    ] },
];

function formatINR(paise) { return '₹' + ((Number(paise) || 0) / 100).toLocaleString('en-IN'); }
function safeParseFeatures(s) { try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch (e) { return []; } }

// Look up a plan for charging: DB first (source of truth), hardcoded PLANS as fallback.
async function planLookup(plan_id) {
  try {
    const [[r]] = await db.query('SELECT * FROM plans WHERE plan_id=?', [plan_id]);
    if (r) return { amount:r.amount, months:r.months||1, credits:r.credits||0, label:`${r.group_name} (${r.period_label})`, active: !!r.active, source:'db' };
  } catch (e) {}
  const p = PLANS[plan_id];
  if (p) return { amount:p.amount, months:p.months||1, credits:p.credits||0, label:p.label, active:true, source:'fallback' };
  return null;
}

// Build the grouped catalog the pricing pages render from (active plans only).
async function buildCatalog() {
  const out = { school: [], teacher: [], tutor: [], parent: [] };
  try {
    const [rows] = await db.query('SELECT * FROM plans WHERE active=1 ORDER BY audience, sort_order, plan_id');
    const byGroup = {};
    const order = [];
    for (const r of rows) {
      if (!byGroup[r.group_key]) {
        byGroup[r.group_key] = { _aud:r.audience, name:r.group_name, tagline:r.tagline, highlight:!!r.highlight, accent:r.accent || '#1A56DB', features: safeParseFeatures(r.features), periods:[] };
        if (r.kind === 'contact') { byGroup[r.group_key].enterprise = true; byGroup[r.group_key].priceText = r.price_text || ''; byGroup[r.group_key].subtitle = r.subtitle || ''; }
        order.push(r.group_key);
      }
      if (r.kind !== 'contact') byGroup[r.group_key].periods.push({ id:r.plan_id, label:r.period_label, price:formatINR(r.amount), note:r.note || '' });
    }
    for (const key of order) {
      const g = byGroup[key]; const aud = g._aud; delete g._aud;
      if (out[aud]) out[aud].push(g);
    }
  } catch (e) { /* empty catalog -> pages fall back to their built-in cards */ }
  return out;
}


// ──────────────────────────────────────────────────────────────────────────────
// 2. Razorpay client — loaded safely.
//    If the `razorpay` package isn't installed yet, or the keys aren't set,
//    this stays null and the endpoints return a friendly message INSTEAD of
//    crashing your server. So adding this file can never break your app.
// ──────────────────────────────────────────────────────────────────────────────
let razorpay = null;
try {
  const Razorpay = require('razorpay');
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('💳  Razorpay configured');
  } else {
    console.log('💳  Razorpay: keys not set yet (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) — payment endpoints will report "not configured".');
  }
} catch (e) {
  console.log('💳  Razorpay: package not installed yet (run: npm install razorpay) — payment endpoints will report "not configured".');
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Self-create the payments table + user columns (runs once on load)
// ──────────────────────────────────────────────────────────────────────────────
async function ensureSchema() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS payments (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      user_id             INT,
      plan_id             VARCHAR(80),
      plan_label          VARCHAR(190),
      amount              INT,                 -- in paise
      currency            VARCHAR(10) DEFAULT 'INR',
      months              INT DEFAULT 1,
      razorpay_order_id   VARCHAR(120),
      razorpay_payment_id VARCHAR(120),
      razorpay_signature  VARCHAR(255),
      status              VARCHAR(20) DEFAULT 'created',  -- created | paid | failed
      credits_added       INT DEFAULT 0,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pay_user  (user_id),
      INDEX idx_pay_order (razorpay_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Add plan tracking columns to users (only if missing — non-destructive)
    const addCol = async (col, def) => {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME=?`,
        [col]
      );
      if (!rows.length) {
        await db.query(`ALTER TABLE users ADD COLUMN \`${col}\` ${def}`);
      }
    };
    await addCol('plan', "VARCHAR(80) DEFAULT NULL");
    await addCol('plan_expires_at', 'DATETIME DEFAULT NULL');
    await addCol('credits', 'INT DEFAULT 0');

    // Older installs: make sure payments.credits_added exists
    const [pc] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='payments' AND COLUMN_NAME='credits_added'`
    );
    if (!pc.length) await db.query("ALTER TABLE payments ADD COLUMN `credits_added` INT DEFAULT 0");

    // Admin-editable plans catalog
    await db.query(`CREATE TABLE IF NOT EXISTS plans (
      plan_id      VARCHAR(80) PRIMARY KEY,
      audience     VARCHAR(20),
      group_key    VARCHAR(80),
      group_name   VARCHAR(160),
      tagline      VARCHAR(255),
      period_label VARCHAR(60),
      amount       INT,
      months       INT DEFAULT 1,
      credits      INT DEFAULT 0,
      note         VARCHAR(60) DEFAULT '',
      features     TEXT,
      highlight    TINYINT DEFAULT 0,
      accent       VARCHAR(20) DEFAULT '#1A56DB',
      sort_order   INT DEFAULT 0,
      active       TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Older installs: ensure the newer plan columns exist
    const addPlanCol = async (col, def) => {
      const [r] = await db.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='plans' AND COLUMN_NAME=?`, [col]);
      if (!r.length) await db.query(`ALTER TABLE plans ADD COLUMN \`${col}\` ${def}`);
    };
    await addPlanCol('kind', "VARCHAR(20) DEFAULT 'paid'");
    await addPlanCol('price_text', "VARCHAR(80) DEFAULT ''");
    await addPlanCol('subtitle', "VARCHAR(160) DEFAULT ''");

    // Seed the plans table once (only when empty) from the SEED catalog above
    const [[cnt]] = await db.query('SELECT COUNT(*) AS n FROM plans');
    if (!cnt || cnt.n === 0) {
      let sort = 0;
      for (const g of SEED) {
        const featuresJson = JSON.stringify(PAGE_FEATURES[g.group_key] || g.features || []);
        for (const per of g.periods) {
          await db.query(
            `INSERT INTO plans (plan_id, audience, group_key, group_name, tagline, period_label, amount, months, credits, note, features, highlight, accent, sort_order, active, kind, price_text, subtitle)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`,
            [per.plan_id, g.audience, g.group_key, g.name, g.tagline, per.period_label, per.amount, per.months, per.credits, per.note || '', featuresJson, g.highlight ? 1 : 0, g.accent || '#1A56DB', sort++, g.kind || 'paid', g.price_text || '', g.subtitle || '']
          );
        }
      }
      console.log('✅  Plans table seeded');
    }

    // Ensure the School Enterprise (contact-sales) plan exists on installs seeded before it was added
    const [[ent]] = await db.query("SELECT plan_id FROM plans WHERE plan_id='school_enterprise'");
    if (!ent) {
      await db.query(
        `INSERT INTO plans (plan_id, audience, group_key, group_name, tagline, period_label, amount, months, credits, note, features, highlight, accent, sort_order, active, kind, price_text, subtitle)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`,
        ['school_enterprise','school','school_enterprise','Enterprise Chain School','For groups with 5+ schools','',0,1,0,'',
         JSON.stringify(PAGE_FEATURES.school_enterprise),
         0,'#7C3AED',99,'contact','₹25,000 – ₹1,00,000','Ideal for groups with 5+ schools']
      );
      console.log('✅  Enterprise plan ensured');
    }

    // Ensure the Parent plans exist on installs seeded before parent pricing was added
    const [[pcnt]] = await db.query("SELECT COUNT(*) AS n FROM plans WHERE audience='parent'");
    if (!pcnt || pcnt.n === 0) {
      let psort = 50;
      for (const g of SEED.filter(s => s.audience === 'parent')) {
        const featuresJson = JSON.stringify(PAGE_FEATURES[g.group_key] || g.features || []);
        for (const per of g.periods) {
          await db.query(
            `INSERT INTO plans (plan_id, audience, group_key, group_name, tagline, period_label, amount, months, credits, note, features, highlight, accent, sort_order, active, kind, price_text, subtitle)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`,
            [per.plan_id, g.audience, g.group_key, g.name, g.tagline, per.period_label, per.amount, per.months, per.credits, per.note || '', featuresJson, g.highlight ? 1 : 0, g.accent || '#1A56DB', psort++, g.kind || 'paid', g.price_text || '', g.subtitle || '']
          );
        }
      }
      console.log('✅  Parent plans ensured');
    }

    // One-time: sync plan features to the pricing-page set (runs once, then leaves admin edits alone)
    await db.query(`CREATE TABLE IF NOT EXISTS app_meta (k VARCHAR(60) PRIMARY KEY, v VARCHAR(255)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const [[fv]] = await db.query("SELECT v FROM app_meta WHERE k='features_ver'");
    if (!fv || fv.v !== 'pricing_v1') {
      for (const [gk, feats] of Object.entries(PAGE_FEATURES)) {
        await db.query('UPDATE plans SET features=? WHERE group_key=?', [JSON.stringify(feats), gk]);
      }
      await db.query("INSERT INTO app_meta (k, v) VALUES ('features_ver','pricing_v1') ON DUPLICATE KEY UPDATE v='pricing_v1'");
      console.log('✅  Plan features synced to pricing-page set');
    }

    console.log('✅  Payments table + user plan columns ready');
  } catch (err) {
    console.error('⚠️  Payments schema:', err.message);
  }
}
ensureSchema();

// ──────────────────────────────────────────────────────────────────────────────
// 4. Endpoints
// ──────────────────────────────────────────────────────────────────────────────

// GET /api/payments/config  (public) — key_id + plan list + grouped catalog
async function getConfig(req, res) {
  const plans = publicPlans();
  let catalog = { school: [], teacher: [], tutor: [], parent: [] };
  try {
    catalog = await buildCatalog();
    const [rows] = await db.query('SELECT plan_id, group_name, period_label, amount, months, credits FROM plans WHERE active=1');
    for (const r of rows) plans[r.plan_id] = { label:`${r.group_name} (${r.period_label})`, amount:r.amount, months:r.months, currency:'INR', credits:r.credits || 0 };
  } catch (e) {}
  res.json({
    configured: !!razorpay,
    key_id: process.env.RAZORPAY_KEY_ID || null,  // public key — safe to expose
    plans,
    catalog,
  });
}

// POST /api/payments/create-order  (any logged-in user)
// Body: { plan_id }
async function createOrder(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ message: 'Payments are not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET and run "npm install razorpay".' });
    }
    const { plan_id } = req.body;
    const plan = await planLookup(plan_id);
    if (!plan) return res.status(400).json({ message: 'Unknown plan.' });
    if (!plan.active) return res.status(400).json({ message: 'This plan is no longer available.' });

    const order = await razorpay.orders.create({
      amount:   plan.amount,   // paise — decided here, NOT by the browser
      currency: 'INR',
      receipt:  `acadhr_${req.user.id}_${Date.now()}`,
      notes:    { user_id: String(req.user.id), plan_id },
    });

    await db.query(
      `INSERT INTO payments (user_id, plan_id, plan_label, amount, currency, months, razorpay_order_id, status)
       VALUES (?,?,?,?,?,?,?, 'created')`,
      [req.user.id, plan_id, plan.label, plan.amount, 'INR', plan.months, order.id]
    );

    res.json({
      order_id:      order.id,
      amount:        order.amount,
      currency:      order.currency,
      key_id:        process.env.RAZORPAY_KEY_ID,
      plan_id,
      label:         plan.label,
      credits:       plan.credits || 0,
      prefill_name:  req.user.name  || '',
      prefill_email: req.user.email || '',
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not create payment order: ' + err.message });
  }
}

// POST /api/payments/verify  (any logged-in user)
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id }
async function verifyPayment(req, res) {
  try {
    if (!razorpay) return res.status(503).json({ message: 'Payments are not configured.' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields.' });
    }

    // Verify signature: HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    let valid = false;
    try {
      valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    } catch { valid = false; }

    if (!valid) {
      await db.query(
        `UPDATE payments SET status='failed', razorpay_payment_id=?, razorpay_signature=? WHERE razorpay_order_id=?`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id]
      );
      return res.status(400).json({ message: 'Payment verification failed. If money was deducted it will be auto-refunded by Razorpay.' });
    }

    const plan = (await planLookup(plan_id)) || { months: 1, credits: 0 };
    const creditsToAdd = Number(plan.credits) || 0;

    // Signature is valid — mark paid and record the credits granted
    await db.query(
      `UPDATE payments SET status='paid', razorpay_payment_id=?, razorpay_signature=?, credits_added=? WHERE razorpay_order_id=?`,
      [razorpay_payment_id, razorpay_signature, creditsToAdd, razorpay_order_id]
    );

    // Update the user's plan + expiry AND add credits based on the plan they bought
    await db.query(
      `UPDATE users
         SET plan = ?,
             plan_expires_at = DATE_ADD(NOW(), INTERVAL ? MONTH),
             credits = COALESCE(credits, 0) + ?
       WHERE id = ?`,
      [plan_id || null, plan.months || 1, creditsToAdd, req.user.id]
    );

    // ADDED: parents keep a separate contact-credit balance in the `parents` table,
    // so mirror the purchased credits there too when a parent pays.
    try {
      const [[urow]] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      if (urow && urow.role === 'parent' && creditsToAdd > 0) {
        await db.query('INSERT IGNORE INTO parents (user_id, credits) VALUES (?, 0)', [req.user.id]);
        await db.query('UPDATE parents SET credits = COALESCE(credits, 0) + ? WHERE user_id = ?', [creditsToAdd, req.user.id]);
      }
    } catch (e) { /* non-fatal */ }

    // Read back the new balance to return it
    let creditsBalance = null;
    try {
      const [[row]] = await db.query('SELECT COALESCE(credits,0) AS credits FROM users WHERE id = ?', [req.user.id]);
      creditsBalance = row ? row.credits : null;
    } catch (e) {}

    res.json({ success: true, message: 'Payment successful.', plan: plan_id, credits_added: creditsToAdd, credits_balance: creditsBalance });
  } catch (err) {
    res.status(500).json({ message: 'Could not verify payment: ' + err.message });
  }
}

// GET /api/payments/mine  (any logged-in user) — their own payment history
async function myPayments(req, res) {
  try {
    const [rows] = await db.query(
      // ADDED: also return the razorpay ids, credits added and buyer name/email so the
      // frontend can render a downloadable receipt. Existing fields are unchanged.
      `SELECT p.id, p.plan_id, p.plan_label, p.amount, p.currency, p.months, p.status, p.created_at,
              p.razorpay_payment_id, p.razorpay_order_id, p.credits_added,
              u.name AS user_name, u.email AS user_email, u.role AS user_role
         FROM payments p
         LEFT JOIN users u ON u.id = p.user_id
        WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching payments: ' + err.message });
  }
}

// GET /api/payments/all  (admin only) — for your Admin "Payments" tab
async function listPayments(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
         FROM payments p
         LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC LIMIT 500`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching payments: ' + err.message });
  }
}

// GET /api/payments/credits  (any logged-in user) — current credit balance
// CHANGED (additive): now also returns the active plan and how many DAYS are left
// before it expires (plan_expires_at = purchase date + plan months). Existing
// `credits` field is unchanged, so nothing that already used this breaks.
async function getCredits(req, res) {
  try {
    let row;
    try {
      [[row]] = await db.query('SELECT COALESCE(credits,0) AS credits, plan, plan_expires_at FROM users WHERE id = ?', [req.user.id]);
    } catch (e) {
      // older DB without plan/plan_expires_at columns — fall back to credits only
      [[row]] = await db.query('SELECT COALESCE(credits,0) AS credits FROM users WHERE id = ?', [req.user.id]);
    }
    let days_left = null, plan_active = false;
    if (row && row.plan_expires_at) {
      const ms = new Date(row.plan_expires_at).getTime() - Date.now();
      days_left = Math.max(0, Math.ceil(ms / 86400000)); // round up to whole days, never below 0
      plan_active = days_left > 0;
    }
    res.json({
      credits: row ? row.credits : 0,
      plan: (row && row.plan) || null,
      plan_expires_at: (row && row.plan_expires_at) || null,
      days_left,
      plan_active,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching credits: ' + err.message });
  }
}

// GET /api/payments/admin/plans  (admin) — all plans grouped, for the editor
async function adminListPlans(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM plans ORDER BY audience, sort_order, plan_id');
    const groups = {}; const order = [];
    for (const r of rows) {
      if (!groups[r.group_key]) {
        groups[r.group_key] = { group_key:r.group_key, audience:r.audience, group_name:r.group_name, tagline:r.tagline, highlight:!!r.highlight, accent:r.accent || '#1A56DB', features: safeParseFeatures(r.features), kind: r.kind || 'paid', price_text: r.price_text || '', subtitle: r.subtitle || '', periods:[] };
        order.push(r.group_key);
      }
      groups[r.group_key].periods.push({ plan_id:r.plan_id, period_label:r.period_label, amount:r.amount, months:r.months, credits:r.credits, note:r.note || '', active:!!r.active });
    }
    res.json(order.map(k => groups[k]));
  } catch (err) {
    res.status(500).json({ message: 'Error loading plans: ' + err.message });
  }
}

// POST /api/payments/admin/plans/save-group  (admin) — save one plan group's edits
// Body: { group_name, tagline, features:[], highlight, accent, periods:[{plan_id, period_label, amount(paise), months, credits, note, active}] }
async function adminSaveGroup(req, res) {
  try {
    const g = req.body || {};
    if (!Array.isArray(g.periods) || g.periods.length === 0) return res.status(400).json({ message: 'No plan rows to save.' });
    const featuresJson = JSON.stringify(Array.isArray(g.features) ? g.features.filter(x => String(x).trim() !== '') : []);
    for (const per of g.periods) {
      if (!per.plan_id) continue;
      const amount  = Math.max(0, Math.round(Number(per.amount)  || 0));
      const months  = Math.max(1, Math.round(Number(per.months)  || 1));
      const credits = Math.max(0, Math.round(Number(per.credits) || 0));
      await db.query(
        `UPDATE plans SET group_name=?, tagline=?, features=?, highlight=?, accent=?, price_text=?, subtitle=?, period_label=?, amount=?, months=?, credits=?, note=?, active=? WHERE plan_id=?`,
        [g.group_name || '', g.tagline || '', featuresJson, g.highlight ? 1 : 0, g.accent || '#1A56DB', g.price_text || '', g.subtitle || '',
         per.period_label || '', amount, months, credits, per.note || '', per.active ? 1 : 0, per.plan_id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error saving plan: ' + err.message });
  }
}

module.exports = { getConfig, createOrder, verifyPayment, myPayments, listPayments, getCredits, adminListPlans, adminSaveGroup };
