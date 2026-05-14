/**
 * ═══════════════════════════════════════════════════════════════
 *  SALONEASE — NODE.JS BACKEND SERVER  (server.js)
 *
 *  REST API backed by SQLite (two separate database files):
 *    • client.db  — clients table + client_appointments table
 *    • admin.db   — appointments table + chairs table + settings table
 *
 *  Run:  npm install && node server.js
 *  API base: http://localhost:3000/api
 *
 *  ENDPOINTS:
 *  ── CLIENT ──────────────────────────────────────────────────
 *  POST   /api/book              — Submit new booking
 *  GET    /api/bookings/:email   — Client booking history
 *  GET    /api/slots?date=       — Available time slots for date
 *  GET    /api/chairs            — Chair availability (public)
 *  GET    /api/services          — Services list
 *
 *  ── ADMIN ───────────────────────────────────────────────────
 *  POST   /api/admin/login               — Authenticate admin
 *  GET    /api/admin/appointments        — All appointments (with filters)
 *  POST   /api/admin/appointments        — Add appointment
 *  PUT    /api/admin/appointments/:id    — Update appointment
 *  DELETE /api/admin/appointments/:id   — Delete appointment
 *  GET    /api/admin/clients            — All clients
 *  GET    /api/admin/chairs             — All chairs
 *  PUT    /api/admin/chairs/:id         — Update chair
 *  GET    /api/admin/stats              — Dashboard statistics
 *  GET    /api/admin/analytics          — Revenue, trends, popular services
 * ═══════════════════════════════════════════════════════════════
 */

const express    = require('express');
const Database   = require('better-sqlite3');
const cors       = require('cors');
const path       = require('path');
const crypto     = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));  // Serve frontend files

/* ═══════════════════════════════════════════════════════════════
   DATABASE SETUP
═══════════════════════════════════════════════════════════════ */

// ── CLIENT DATABASE ────────────────────────────────────────────
const clientDb = new Database(path.join(__dirname, 'client.db'));
clientDb.pragma('journal_mode = WAL');
clientDb.pragma('foreign_keys = ON');

clientDb.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    phone       TEXT    DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    total_spent INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

  CREATE TABLE IF NOT EXISTS client_appointments (
    id           TEXT    PRIMARY KEY,
    client_email TEXT    NOT NULL,
    client_name  TEXT    NOT NULL,
    service      TEXT    NOT NULL,
    date         TEXT    NOT NULL,
    time         TEXT    NOT NULL,
    chair        TEXT    NOT NULL,
    stylist      TEXT    NOT NULL,
    notes        TEXT    DEFAULT '',
    payment      TEXT    DEFAULT 'pay-at-salon',
    price        INTEGER DEFAULT 0,
    status       TEXT    DEFAULT 'confirmed',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (client_email) REFERENCES clients(email)
  );

  CREATE INDEX IF NOT EXISTS idx_cappt_email  ON client_appointments(client_email);
  CREATE INDEX IF NOT EXISTS idx_cappt_date   ON client_appointments(date);
  CREATE INDEX IF NOT EXISTS idx_cappt_status ON client_appointments(status);
`);

// ── ADMIN DATABASE ─────────────────────────────────────────────
const adminDb = new Database(path.join(__dirname, 'admin.db'));
adminDb.pragma('journal_mode = WAL');

adminDb.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id            TEXT    PRIMARY KEY,
    client_email  TEXT    NOT NULL,
    client_name   TEXT    NOT NULL,
    phone         TEXT    DEFAULT '',
    service       TEXT    NOT NULL,
    date          TEXT    NOT NULL,
    time          TEXT    NOT NULL,
    chair         TEXT    NOT NULL,
    stylist       TEXT    NOT NULL,
    notes         TEXT    DEFAULT '',
    admin_notes   TEXT    DEFAULT '',
    payment       TEXT    DEFAULT 'pay-at-salon',
    price         INTEGER DEFAULT 0,
    status        TEXT    DEFAULT 'confirmed',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    DEFAULT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_appt_date   ON appointments(date);
  CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments(status);
  CREATE INDEX IF NOT EXISTS idx_appt_chair  ON appointments(chair);
  CREATE INDEX IF NOT EXISTS idx_appt_email  ON appointments(client_email);

  CREATE TABLE IF NOT EXISTS chairs (
    id       INTEGER PRIMARY KEY,
    label    TEXT    NOT NULL,
    stylist  TEXT    NOT NULL DEFAULT 'Unassigned',
    status   TEXT    NOT NULL DEFAULT 'available',
    floor    TEXT    NOT NULL DEFAULT 'Ground'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ── SEED ADMIN DATA ────────────────────────────────────────────
function seedAdminDb() {
  // Chairs
  const chairCount = adminDb.prepare('SELECT COUNT(*) AS c FROM chairs').get().c;
  if (chairCount === 0) {
    const insertChair = adminDb.prepare(
      'INSERT INTO chairs (id, label, stylist, status, floor) VALUES (?,?,?,?,?)'
    );
    const chairs = [
      [1,'Chair 1','Meena Joshi', 'reserved',  'Ground'],
      [2,'Chair 2','Sofia Reyes', 'occupied',  'Ground'],
      [3,'Chair 3','Priti Verma', 'occupied',  'Ground'],
      [4,'Chair 4','Radha Nair',  'available', 'Ground'],
      [5,'Chair 5','Aisha Khan',  'occupied',  'Ground'],
      [6,'Chair 6','Aisha Khan',  'occupied',  'Ground'],
      [7,'Chair 7','Radha Nair',  'occupied',  'Ground'],
      [8,'Chair 8','Priti Verma', 'available', 'Ground'],
    ];
    chairs.forEach(c => insertChair.run(...c));
    console.log('[DB] Chairs seeded');
  }

  // Admin credentials
  const credRecord = adminDb.prepare("SELECT * FROM settings WHERE key='admin_credentials'").get();
  if (!credRecord) {
    adminDb.prepare("INSERT INTO settings (key, value) VALUES ('admin_credentials', ?)").run(
      JSON.stringify({ username:'admin', password:'salon123' })
    );
  }

  // Sample appointments
  const apptCount = adminDb.prepare('SELECT COUNT(*) AS c FROM appointments').get().c;
  if (apptCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    const insertAppt = adminDb.prepare(`
      INSERT INTO appointments (id, client_email, client_name, service, date, time, chair, stylist, price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const samples = [
      ['SE100001','riya@example.com',   'Riya Gupta',   'Hair Cut & Style', today,'09:30 AM','Chair 2','Sofia Reyes',  800,  'confirmed'],
      ['SE100002','neha@example.com',   'Neha Patel',   'Bridal Makeup',    today,'11:00 AM','Chair 5','Aisha Khan',   4500, 'confirmed'],
      ['SE100003','sunita@example.com', 'Sunita Rao',   'Spa Treatment',    today,'01:30 PM','Chair 3','Priti Verma',  2000, 'pending'  ],
      ['SE100004','kavita@example.com', 'Kavita Singh', 'Hair Color',       today,'03:00 PM','Chair 1','Meena Joshi',  1500, 'pending'  ],
      ['SE100005','pooja@example.com',  'Pooja Mehta',  'Nail Art',         today,'04:30 PM','Chair 7','Radha Nair',   600,  'completed'],
    ];
    samples.forEach(s => insertAppt.run(...s));
    console.log('[DB] Sample appointments seeded');
  }
}
seedAdminDb();

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function generateId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SE${ts}${rand}`;
}

function toSnake(obj) {
  // Converts DB row (snake_case) to camelCase for API responses
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = v;
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC ROUTES
═══════════════════════════════════════════════════════════════ */

// Services list
const SERVICES = [
  { id:'svc1', icon:'✂️',  name:'Hair Cut & Style',  price:800,  duration:'45 min'  },
  { id:'svc2', icon:'🎨',  name:'Hair Color',         price:1500, duration:'90 min'  },
  { id:'svc3', icon:'💆‍♀️', name:'Spa Treatment',      price:2000, duration:'60 min'  },
  { id:'svc4', icon:'💄',  name:'Bridal Makeup',       price:4500, duration:'120 min' },
  { id:'svc5', icon:'💅',  name:'Nail Art',            price:600,  duration:'45 min'  },
  { id:'svc6', icon:'🌿',  name:'Keratin Treatment',   price:3200, duration:'180 min' },
  { id:'svc7', icon:'👁️',  name:'Eyebrow Threading',  price:150,  duration:'15 min'  },
  { id:'svc8', icon:'✨',  name:'Facial & Cleanup',    price:1200, duration:'60 min'  },
];
app.get('/api/services', (req, res) => res.json(SERVICES));

// Available slots for a date
app.get('/api/slots', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error:'Date required' });
  const booked = adminDb.prepare(
    "SELECT time FROM appointments WHERE date=? AND status != 'cancelled'"
  ).all(date).map(r => r.time);
  const all = [
    '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM',
    '03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM',
  ];
  res.json({ slots: all.map(t => ({ time:t, available:!booked.includes(t) })) });
});

// Public chairs endpoint
app.get('/api/chairs', (req, res) => {
  const chairs = adminDb.prepare('SELECT * FROM chairs ORDER BY id').all().map(toSnake);
  res.json(chairs);
});

// Client booking history
app.get('/api/bookings/:email', (req, res) => {
  const email = req.params.email.toLowerCase().trim();
  const client = clientDb.prepare('SELECT * FROM clients WHERE email=?').get(email);
  const appts  = clientDb.prepare(
    'SELECT * FROM client_appointments WHERE client_email=? ORDER BY date DESC, time DESC'
  ).all(email).map(toSnake);
  res.json({ client: client ? toSnake(client) : null, appointments: appts });
});

// Book appointment
app.post('/api/book', (req, res) => {
  const { name, email, phone, service, date, time, chair, stylist, notes, payment, price } = req.body;
  if (!name || !email || !service || !date || !time) {
    return res.status(400).json({ error:'Missing required fields' });
  }

  const id = generateId();
  const finalChair   = chair   || 'Chair ' + (Math.floor(Math.random()*8)+1);
  const finalStylist = stylist || 'Auto-assigned';
  const now = new Date().toISOString();

  // Write to CLIENT DB
  clientDb.transaction(() => {
    // Upsert client
    const existing = clientDb.prepare('SELECT * FROM clients WHERE email=?').get(email);
    if (existing) {
      clientDb.prepare(
        'UPDATE clients SET total_spent=total_spent+?, visit_count=visit_count+1 WHERE email=?'
      ).run(price||0, email);
    } else {
      clientDb.prepare(
        'INSERT INTO clients (name, email, phone, total_spent, visit_count) VALUES (?,?,?,?,1)'
      ).run(name, email, phone||'', price||0);
    }
    // Add appointment
    clientDb.prepare(`
      INSERT INTO client_appointments (id, client_email, client_name, service, date, time, chair, stylist, notes, payment, price, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(id, email, name, service, date, time, finalChair, finalStylist, notes||'', payment||'pay-at-salon', price||0, 'confirmed', now);
  })();

  // Write to ADMIN DB
  adminDb.prepare(`
    INSERT INTO appointments (id, client_email, client_name, phone, service, date, time, chair, stylist, notes, payment, price, status, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, email, name, phone||'', service, date, time, finalChair, finalStylist, notes||'', payment||'pay-at-salon', price||0, 'confirmed', now);

  res.json({ success:true, id, message:'Booking confirmed' });
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN ROUTES
═══════════════════════════════════════════════════════════════ */

// Simple token store (in production use JWT)
const adminSessions = new Set();

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error:'Unauthorized' });
  }
  next();
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const record = adminDb.prepare("SELECT value FROM settings WHERE key='admin_credentials'").get();
  const creds  = JSON.parse(record.value);
  if (username !== creds.username || password !== creds.password) {
    return res.status(401).json({ error:'Invalid credentials' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.add(token);
  res.json({ success:true, token });
});

// Get all appointments (with optional filters)
app.get('/api/admin/appointments', requireAdmin, (req, res) => {
  const { status, date, search } = req.query;
  let sql = 'SELECT * FROM appointments WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { sql += ' AND status=?'; params.push(status); }
  if (date)   { sql += ' AND date=?';   params.push(date);   }
  if (search) { sql += ' AND (client_name LIKE ? OR client_email LIKE ?)'; params.push(`%${search}%`,`%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  const rows = adminDb.prepare(sql).all(...params).map(toSnake);
  res.json(rows);
});

// Add appointment from admin
app.post('/api/admin/appointments', requireAdmin, (req, res) => {
  const { name, email, phone, service, date, time, chair, stylist, price, status } = req.body;
  if (!name || !email || !service || !date || !time) {
    return res.status(400).json({ error:'Missing required fields' });
  }
  const id = generateId();
  adminDb.prepare(`
    INSERT INTO appointments (id, client_email, client_name, phone, service, date, time, chair, stylist, price, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, email, name, phone||'', service, date, time, chair||'Chair 1', stylist||'Auto-assigned', price||0, status||'confirmed');
  res.json({ success:true, id });
});

// Update appointment
app.put('/api/admin/appointments/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { date, time, chair, stylist, status, adminNotes } = req.body;
  const now = new Date().toISOString();

  adminDb.prepare(`
    UPDATE appointments SET date=COALESCE(?,date), time=COALESCE(?,time),
    chair=COALESCE(?,chair), stylist=COALESCE(?,stylist), status=COALESCE(?,status),
    admin_notes=COALESCE(?,admin_notes), updated_at=? WHERE id=?`
  ).run(date||null, time||null, chair||null, stylist||null, status||null, adminNotes||null, now, id);

  // Sync to client DB
  clientDb.prepare(`
    UPDATE client_appointments SET date=COALESCE(?,date), time=COALESCE(?,time),
    chair=COALESCE(?,chair), stylist=COALESCE(?,stylist), status=COALESCE(?,status)
    WHERE id=?`
  ).run(date||null, time||null, chair||null, stylist||null, status||null, id);

  res.json({ success:true });
});

// Delete appointment
app.delete('/api/admin/appointments/:id', requireAdmin, (req, res) => {
  adminDb.prepare('DELETE FROM appointments WHERE id=?').run(req.params.id);
  clientDb.prepare('DELETE FROM client_appointments WHERE id=?').run(req.params.id);
  res.json({ success:true });
});

// All clients
app.get('/api/admin/clients', requireAdmin, (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM clients WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`,`%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(clientDb.prepare(sql).all(...params).map(toSnake));
});

// All chairs
app.get('/api/admin/chairs', requireAdmin, (req, res) => {
  res.json(adminDb.prepare('SELECT * FROM chairs ORDER BY id').all().map(toSnake));
});

// Update chair
app.put('/api/admin/chairs/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { label, stylist, status } = req.body;
  adminDb.prepare('UPDATE chairs SET label=COALESCE(?,label), stylist=COALESCE(?,stylist), status=COALESCE(?,status) WHERE id=?')
    .run(label||null, stylist||null, status||null, parseInt(id));
  res.json({ success:true });
});

// Dashboard stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCount   = adminDb.prepare("SELECT COUNT(*) AS c FROM appointments WHERE date=?").get(today).c;
  const pendingCount = adminDb.prepare("SELECT COUNT(*) AS c FROM appointments WHERE status='pending'").get().c;
  const availChairs  = adminDb.prepare("SELECT COUNT(*) AS c FROM chairs WHERE status='available'").get().c;
  const todayRevenue = adminDb.prepare("SELECT COALESCE(SUM(price),0) AS r FROM appointments WHERE date=? AND status='completed'").get(today).r;
  const totalClients = clientDb.prepare('SELECT COUNT(*) AS c FROM clients').get().c;
  const totalAppts   = adminDb.prepare('SELECT COUNT(*) AS c FROM appointments').get().c;
  const totalRevenue = adminDb.prepare("SELECT COALESCE(SUM(price),0) AS r FROM appointments WHERE status='completed'").get().r;
  res.json({ todayCount, pendingCount, availableChairs:availChairs, todayRevenue, totalClients, totalAppointments:totalAppts, totalRevenue });
});

// Analytics
app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  // Last 7 days booking counts
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label   = d.toLocaleDateString('en-US', { weekday:'short' });
    const count   = adminDb.prepare('SELECT COUNT(*) AS c FROM appointments WHERE date=?').get(dateStr).c;
    last7.push({ date:dateStr, label, count });
  }

  // Service popularity
  const services = adminDb.prepare(
    'SELECT service, COUNT(*) AS count FROM appointments GROUP BY service ORDER BY count DESC LIMIT 8'
  ).all();

  // Monthly revenue (current year)
  const year = new Date().getFullYear();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthly = months.map((month, i) => {
    const monthStr = String(i+1).padStart(2,'0');
    const revenue = adminDb.prepare(
      `SELECT COALESCE(SUM(price),0) AS r FROM appointments WHERE date LIKE '${year}-${monthStr}-%' AND status='completed'`
    ).get().r;
    return { month, revenue };
  });

  res.json({ last7Days: last7, servicePopularity: services, monthlyRevenue: monthly });
});

/* ═══════════════════════════════════════════════════════════════
   START SERVER
═══════════════════════════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║    SalonEase Server Running ✓        ║`);
  console.log(`║    http://localhost:${PORT}             ║`);
  console.log(`║    Admin: admin / salon123            ║`);
  console.log(`╚══════════════════════════════════════╝\n`);
});

module.exports = { app, clientDb, adminDb };
