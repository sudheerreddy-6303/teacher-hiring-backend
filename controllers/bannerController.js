'use strict';
// ─── AcadHr Banner Controller ─────────────────────────────────────────────────
// NEW FILE. Admin-managed banners for the Home page and the Browse pages.
// Self-creating table (same pattern as the other controllers). Nothing existing
// is changed by adding this file.

const db = require('../config/db');

// Allowed placements (each page reads its own).
const PLACEMENTS = ['home', 'browse_teachers', 'browse_tutors', 'browse_tuitions', 'browse_jobs'];

let _ready = false;
async function ensureSchema() {
  if (_ready) return;
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS banners (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      placement   VARCHAR(40)  NOT NULL,
      title       VARCHAR(200)  DEFAULT '',
      subtitle    VARCHAR(400)  DEFAULT '',
      image_url   LONGTEXT,                     -- a URL, a /public path, or a data: URL
      link_url    VARCHAR(400)  DEFAULT '',
      cta_text    VARCHAR(80)   DEFAULT '',
      bg_color    VARCHAR(30)   DEFAULT '',
      active      TINYINT(1)    DEFAULT 1,
      sort_order  INT           DEFAULT 0,
      created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_banner_place (placement)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    _ready = true;
  } catch (e) { console.error('⚠️  Banner schema:', e.message); }
}
ensureSchema();

// GET /api/banners?placement=home   (public) — active banners for one placement
async function listPublic(req, res) {
  try {
    await ensureSchema();
    const placement = String(req.query.placement || '').trim();
    let rows;
    if (placement) {
      [rows] = await db.query(
        'SELECT id, placement, title, subtitle, image_url, link_url, cta_text, bg_color, sort_order FROM banners WHERE placement=? AND active=1 ORDER BY sort_order, id',
        [placement]
      );
    } else {
      [rows] = await db.query(
        'SELECT id, placement, title, subtitle, image_url, link_url, cta_text, bg_color, sort_order FROM banners WHERE active=1 ORDER BY placement, sort_order, id'
      );
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Error loading banners: ' + e.message }); }
}

// GET /api/banners/all   (admin) — every banner (optionally by placement)
async function listAll(req, res) {
  try {
    await ensureSchema();
    const placement = String(req.query.placement || '').trim();
    let rows;
    if (placement) {
      [rows] = await db.query('SELECT * FROM banners WHERE placement=? ORDER BY sort_order, id', [placement]);
    } else {
      [rows] = await db.query('SELECT * FROM banners ORDER BY placement, sort_order, id');
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Error loading banners: ' + e.message }); }
}

// POST /api/banners/save   (admin) — create or update one banner
async function save(req, res) {
  try {
    await ensureSchema();
    const b = req.body || {};
    const placement = PLACEMENTS.includes(b.placement) ? b.placement : 'home';
    const vals = {
      placement,
      title:      (b.title      || '').toString().slice(0, 200),
      subtitle:   (b.subtitle   || '').toString().slice(0, 400),
      image_url:  (b.image_url  || '').toString(),
      link_url:   (b.link_url   || '').toString().slice(0, 400),
      cta_text:   (b.cta_text   || '').toString().slice(0, 80),
      bg_color:   (b.bg_color   || '').toString().slice(0, 30),
      active:     b.active === 0 || b.active === false ? 0 : 1,
      sort_order: Number(b.sort_order) || 0,
    };
    if (b.id) {
      await db.query(
        `UPDATE banners SET placement=?, title=?, subtitle=?, image_url=?, link_url=?, cta_text=?, bg_color=?, active=?, sort_order=? WHERE id=?`,
        [vals.placement, vals.title, vals.subtitle, vals.image_url, vals.link_url, vals.cta_text, vals.bg_color, vals.active, vals.sort_order, b.id]
      );
      return res.json({ success: true, id: b.id });
    }
    const [r] = await db.query(
      `INSERT INTO banners (placement, title, subtitle, image_url, link_url, cta_text, bg_color, active, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [vals.placement, vals.title, vals.subtitle, vals.image_url, vals.link_url, vals.cta_text, vals.bg_color, vals.active, vals.sort_order]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) { res.status(500).json({ message: 'Error saving banner: ' + e.message }); }
}

// POST /api/banners/delete   (admin) — remove one banner
async function remove(req, res) {
  try {
    await ensureSchema();
    const id = req.body && req.body.id;
    if (!id) return res.status(400).json({ message: 'Missing banner id.' });
    await db.query('DELETE FROM banners WHERE id=?', [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: 'Error deleting banner: ' + e.message }); }
}

module.exports = { listPublic, listAll, save, remove };
