/**
 * ═══════════════════════════════════════════════════════════════
 *  SALONEASE — DATABASE LAYER  (database.js)
 *
 *  Uses IndexedDB — a real browser-native relational-style database.
 *  Two separate databases:
 *    • CLIENT_DB  — stores client profiles + their appointments
 *    • ADMIN_DB   — stores admin appointments, chairs, and settings
 *
 *  Both are persisted on disk by the browser (survives page refresh).
 *
 *  PUBLIC API:
 *    await DB.clients.add(client)
 *    await DB.clients.getByEmail(email)
 *    await DB.clients.getAll()
 *
 *    await DB.appointments.add(appt)           — adds to BOTH DBs
 *    await DB.appointments.getAll()
 *    await DB.appointments.getByEmail(email)
 *    await DB.appointments.getByDate(dateStr)
 *    await DB.appointments.update(id, changes)
 *    await DB.appointments.delete(id)
 *
 *    await DB.chairs.getAll()
 *    await DB.chairs.update(id, changes)
 *
 *    await DB.admin.verify(username, password)  — returns bool
 * ═══════════════════════════════════════════════════════════════
 */

const DB = (() => {

  // ─── DB NAMES & VERSIONS ──────────────────────────────────────
  const CLIENT_DB_NAME  = 'SalonEase_ClientDB';
  const ADMIN_DB_NAME   = 'SalonEase_AdminDB';
  const DB_VERSION      = 2;

  // ─── OPEN / CREATE DATABASE ───────────────────────────────────
  function openDB(name, version, upgradeCallback) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = e => upgradeCallback(e.target.result, e.oldVersion);
      req.onsuccess  = e => resolve(e.target.result);
      req.onerror    = e => reject(e.target.error);
    });
  }

  // ─── CLIENT DATABASE SCHEMA ───────────────────────────────────
  //  Stores:
  //    clients       — { id, name, email, phone, createdAt, totalSpent, visitCount }
  //    appointments  — { id, clientEmail, clientName, service, date, time,
  //                       chair, stylist, notes, payment, price, status, createdAt }
  async function getClientDB() {
    return openDB(CLIENT_DB_NAME, DB_VERSION, (db, oldVersion) => {
      if (oldVersion < 1) {
        const clients = db.createObjectStore('clients', { keyPath:'id', autoIncrement:true });
        clients.createIndex('email',     'email',     { unique:true });
        clients.createIndex('name',      'name',      { unique:false });
        clients.createIndex('createdAt', 'createdAt', { unique:false });

        const appts = db.createObjectStore('appointments', { keyPath:'id' });
        appts.createIndex('clientEmail', 'clientEmail', { unique:false });
        appts.createIndex('date',        'date',         { unique:false });
        appts.createIndex('status',      'status',       { unique:false });
      }
    });
  }

  // ─── ADMIN DATABASE SCHEMA ────────────────────────────────────
  //  Stores:
  //    appointments  — same fields as client, plus adminNotes
  //    chairs        — { id, label, stylist, status, floor }
  //    settings      — { key, value }
  async function getAdminDB() {
    return openDB(ADMIN_DB_NAME, DB_VERSION, (db, oldVersion) => {
      if (oldVersion < 1) {
        const appts = db.createObjectStore('appointments', { keyPath:'id' });
        appts.createIndex('date',   'date',   { unique:false });
        appts.createIndex('status', 'status', { unique:false });
        appts.createIndex('chair',  'chair',  { unique:false });

        const chairs = db.createObjectStore('chairs', { keyPath:'id' });

        const settings = db.createObjectStore('settings', { keyPath:'key' });
      }
      if (oldVersion < 2) {
        // Already handled above in v1 creation
      }
    });
  }

  // ─── GENERIC HELPERS ──────────────────────────────────────────
  function tx(db, storeName, mode='readonly') {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function promisify(req) {
    return new Promise((res, rej) => {
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e.target.error);
    });
  }

  function getAllFromStore(db, storeName) {
    return promisify(tx(db, storeName).getAll());
  }

  function getByIndex(db, storeName, indexName, value) {
    return promisify(tx(db, storeName).index(indexName).getAll(value));
  }

  function putRecord(db, storeName, record) {
    return promisify(tx(db, storeName, 'readwrite').put(record));
  }

  function addRecord(db, storeName, record) {
    return promisify(tx(db, storeName, 'readwrite').add(record));
  }

  function deleteRecord(db, storeName, key) {
    return promisify(tx(db, storeName, 'readwrite').delete(key));
  }

  function getRecord(db, storeName, key) {
    return promisify(tx(db, storeName).get(key));
  }

  // ─── SEED DATA ────────────────────────────────────────────────
  async function seedAdminDB(adminDb) {
    const existing = await getAllFromStore(adminDb, 'appointments');
    if (existing.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const seedAppts = [
        { id:'SE100001', clientEmail:'riya@example.com',  clientName:'Riya Gupta',   service:'Hair Cut & Style', date:today, time:'09:30 AM', chair:'Chair 2', stylist:'Sofia Reyes',  notes:'',              payment:'pay-at-salon', price:800,  status:'confirmed',  createdAt:new Date().toISOString(), adminNotes:'' },
        { id:'SE100002', clientEmail:'neha@example.com',  clientName:'Neha Patel',   service:'Bridal Makeup',    date:today, time:'11:00 AM', chair:'Chair 5', stylist:'Aisha Khan',   notes:'Full bridal look', payment:'upi',        price:4500, status:'confirmed',  createdAt:new Date().toISOString(), adminNotes:'' },
        { id:'SE100003', clientEmail:'sunita@example.com',clientName:'Sunita Rao',   service:'Spa Treatment',    date:today, time:'01:30 PM', chair:'Chair 3', stylist:'Priti Verma',  notes:'Allergic to nuts', payment:'card',       price:2000, status:'pending',    createdAt:new Date().toISOString(), adminNotes:'' },
        { id:'SE100004', clientEmail:'kavita@example.com',clientName:'Kavita Singh', service:'Hair Color',       date:today, time:'03:00 PM', chair:'Chair 1', stylist:'Meena Joshi',  notes:'Wants ombre',   payment:'pay-at-salon', price:1500, status:'pending',    createdAt:new Date().toISOString(), adminNotes:'' },
        { id:'SE100005', clientEmail:'pooja@example.com', clientName:'Pooja Mehta',  service:'Nail Art',         date:today, time:'04:30 PM', chair:'Chair 7', stylist:'Radha Nair',   notes:'',              payment:'pay-at-salon', price:600,  status:'completed',  createdAt:new Date().toISOString(), adminNotes:'' },
        { id:'SE100006', clientEmail:'meera@example.com', clientName:'Meera Iyer',   service:'Facial & Cleanup', date:today, time:'10:00 AM', chair:'Chair 6', stylist:'Aisha Khan',   notes:'',              payment:'upi',          price:1200, status:'confirmed',  createdAt:new Date().toISOString(), adminNotes:'' },
      ];
      for (const a of seedAppts) await addRecord(adminDb, 'appointments', a);
    }

    const existingChairs = await getAllFromStore(adminDb, 'chairs');
    if (existingChairs.length === 0) {
      const chairs = [
        { id:1, label:'Chair 1', stylist:'Meena Joshi', status:'reserved',  floor:'Ground' },
        { id:2, label:'Chair 2', stylist:'Sofia Reyes', status:'occupied',  floor:'Ground' },
        { id:3, label:'Chair 3', stylist:'Priti Verma', status:'occupied',  floor:'Ground' },
        { id:4, label:'Chair 4', stylist:'Radha Nair',  status:'available', floor:'Ground' },
        { id:5, label:'Chair 5', stylist:'Aisha Khan',  status:'occupied',  floor:'Ground' },
        { id:6, label:'Chair 6', stylist:'Aisha Khan',  status:'occupied',  floor:'Ground' },
        { id:7, label:'Chair 7', stylist:'Radha Nair',  status:'occupied',  floor:'Ground' },
        { id:8, label:'Chair 8', stylist:'Priti Verma', status:'available', floor:'Ground' },
      ];
      for (const c of chairs) await addRecord(adminDb, 'chairs', c);
    }

    const existingSettings = await getRecord(adminDb, 'settings', 'admin_credentials');
    if (!existingSettings) {
      await addRecord(adminDb, 'settings', {
        key:'admin_credentials',
        value:{ username:'admin', password:'salon123' }
      });
    }
  }

  async function seedClientDB(clientDb) {
    const existing = await getAllFromStore(clientDb, 'clients');
    if (existing.length === 0) {
      const clients = [
        { id:undefined, name:'Riya Gupta',   email:'riya@example.com',   phone:'+91 98765 11111', createdAt:new Date().toISOString(), totalSpent:800,  visitCount:1 },
        { id:undefined, name:'Neha Patel',   email:'neha@example.com',   phone:'+91 98765 22222', createdAt:new Date().toISOString(), totalSpent:4500, visitCount:1 },
        { id:undefined, name:'Sunita Rao',   email:'sunita@example.com', phone:'+91 98765 33333', createdAt:new Date().toISOString(), totalSpent:2000, visitCount:1 },
        { id:undefined, name:'Kavita Singh', email:'kavita@example.com', phone:'+91 98765 44444', createdAt:new Date().toISOString(), totalSpent:1500, visitCount:1 },
        { id:undefined, name:'Pooja Mehta',  email:'pooja@example.com',  phone:'+91 98765 55555', createdAt:new Date().toISOString(), totalSpent:600,  visitCount:1 },
        { id:undefined, name:'Meera Iyer',   email:'meera@example.com',  phone:'+91 98765 66666', createdAt:new Date().toISOString(), totalSpent:1200, visitCount:1 },
      ];
      for (const c of clients) {
        const { id, ...rest } = c;   // let autoIncrement assign id
        await addRecord(clientDb, 'clients', rest);
      }
    }
  }

  // ─── INITIALIZE ───────────────────────────────────────────────
  let _clientDb = null;
  let _adminDb  = null;
  let _ready    = false;

  async function init() {
    if (_ready) return;
    _clientDb = await getClientDB();
    _adminDb  = await getAdminDB();
    await seedAdminDB(_adminDb);
    await seedClientDB(_clientDb);
    _ready = true;
    console.log('%c[SalonEase DB] Both databases initialized ✓', 'color:#c9a96e;font-weight:bold');
  }

  async function ensureReady() {
    if (!_ready) await init();
  }

  // ─── PUBLIC CLIENT API ────────────────────────────────────────
  const clients = {
    async add(client) {
      await ensureReady();
      // Upsert: if email exists, update; otherwise add
      const existing = await clients.getByEmail(client.email);
      if (existing) {
        existing.visitCount = (existing.visitCount || 0) + 1;
        existing.totalSpent = (existing.totalSpent || 0) + (client.lastSpent || 0);
        await putRecord(_clientDb, 'clients', existing);
        return existing;
      } else {
        const record = {
          name: client.name, email: client.email, phone: client.phone || '',
          createdAt: new Date().toISOString(), totalSpent: client.lastSpent || 0,
          visitCount: 1
        };
        const id = await addRecord(_clientDb, 'clients', record);
        return { ...record, id };
      }
    },

    async getByEmail(email) {
      await ensureReady();
      const results = await getByIndex(_clientDb, 'clients', 'email', email);
      return results[0] || null;
    },

    async getAll() {
      await ensureReady();
      return getAllFromStore(_clientDb, 'clients');
    },

    async update(email, changes) {
      await ensureReady();
      const existing = await clients.getByEmail(email);
      if (!existing) return null;
      const updated = { ...existing, ...changes };
      await putRecord(_clientDb, 'clients', updated);
      return updated;
    }
  };

  // ─── PUBLIC APPOINTMENTS API ──────────────────────────────────
  const appointments = {
    // Generates a unique booking ID
    generateId() {
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2,5).toUpperCase();
      return `SE${ts}${rand}`;
    },

    async add(apptData) {
      await ensureReady();
      const id = apptData.id || this.generateId();
      const record = {
        id,
        clientEmail: apptData.email,
        clientName:  apptData.name,
        service:     apptData.service,
        date:        apptData.date,
        time:        apptData.time,
        chair:       apptData.chair || 'Auto-assigned',
        stylist:     apptData.stylist || 'Auto-assigned',
        notes:       apptData.notes || '',
        payment:     apptData.payment || 'pay-at-salon',
        price:       apptData.price || 0,
        status:      apptData.status || 'confirmed',
        createdAt:   new Date().toISOString(),
        adminNotes:  ''
      };

      // Write to CLIENT DB (client-facing record)
      await addRecord(_clientDb, 'appointments', { ...record });

      // Write to ADMIN DB (admin-facing record)
      await addRecord(_adminDb, 'appointments', { ...record });

      // Update client record
      await clients.add({
        name: apptData.name, email: apptData.email, phone: apptData.phone,
        lastSpent: apptData.price
      });

      return record;
    },

    async getAll() {
      await ensureReady();
      return getAllFromStore(_adminDb, 'appointments');
    },

    async getByEmail(email) {
      await ensureReady();
      return getByIndex(_clientDb, 'appointments', 'clientEmail', email);
    },

    async getByDate(dateStr) {
      await ensureReady();
      return getByIndex(_adminDb, 'appointments', 'date', dateStr);
    },

    async getByStatus(status) {
      await ensureReady();
      return getByIndex(_adminDb, 'appointments', 'status', status);
    },

    async getById(id) {
      await ensureReady();
      return getRecord(_adminDb, 'appointments', id);
    },

    async update(id, changes) {
      await ensureReady();
      // Update in ADMIN DB
      const existing = await getRecord(_adminDb, 'appointments', id);
      if (!existing) return null;
      const updated = { ...existing, ...changes, updatedAt: new Date().toISOString() };
      await putRecord(_adminDb, 'appointments', updated);

      // Sync update to CLIENT DB if record exists there
      try {
        const clientRecord = await getRecord(_clientDb, 'appointments', id);
        if (clientRecord) {
          await putRecord(_clientDb, 'appointments', { ...clientRecord, ...changes, updatedAt: updated.updatedAt });
        }
      } catch(e) { /* client record might not exist for admin-created appointments */ }

      return updated;
    },

    async delete(id) {
      await ensureReady();
      await deleteRecord(_adminDb, 'appointments', id);
      try { await deleteRecord(_clientDb, 'appointments', id); } catch(e) {}
      return true;
    },

    // Returns times that are already booked for a given date
    async getBookedTimes(dateStr) {
      await ensureReady();
      const appts = await this.getByDate(dateStr);
      return appts
        .filter(a => a.status !== 'cancelled')
        .map(a => a.time);
    }
  };

  // ─── PUBLIC CHAIRS API ────────────────────────────────────────
  const chairs = {
    async getAll() {
      await ensureReady();
      return getAllFromStore(_adminDb, 'chairs');
    },

    async getById(id) {
      await ensureReady();
      return getRecord(_adminDb, 'chairs', id);
    },

    async update(id, changes) {
      await ensureReady();
      const existing = await getRecord(_adminDb, 'chairs', id);
      if (!existing) return null;
      const updated = { ...existing, ...changes };
      await putRecord(_adminDb, 'chairs', updated);
      return updated;
    },

    async getAvailableCount() {
      await ensureReady();
      const all = await this.getAll();
      return all.filter(c => c.status === 'available').length;
    }
  };

  // ─── PUBLIC ADMIN API ─────────────────────────────────────────
  const admin = {
    async verify(username, password) {
      await ensureReady();
      const record = await getRecord(_adminDb, 'settings', 'admin_credentials');
      if (!record) return false;
      return record.value.username === username && record.value.password === password;
    },

    async changePassword(username, newPassword) {
      await ensureReady();
      await putRecord(_adminDb, 'settings', {
        key: 'admin_credentials',
        value: { username, password: newPassword }
      });
    },

    async getStats() {
      await ensureReady();
      const today = new Date().toISOString().split('T')[0];
      const allAppts    = await appointments.getAll();
      const todayAppts  = allAppts.filter(a => a.date === today);
      const pending     = allAppts.filter(a => a.status === 'pending').length;
      const completed   = todayAppts.filter(a => a.status === 'completed');
      const revenue     = completed.reduce((s,a) => s + (a.price || 0), 0);
      const totalRevenue = allAppts.filter(a => a.status === 'completed').reduce((s,a) => s + (a.price||0), 0);
      const availChairs = await chairs.getAvailableCount();
      const allClients  = await clients.getAll();

      return {
        todayCount: todayAppts.length,
        pendingCount: pending,
        availableChairs: availChairs,
        todayRevenue: revenue,
        totalRevenue,
        totalClients: allClients.length,
        totalAppointments: allAppts.length
      };
    },

    // Returns last 7 days booking counts for chart
    async getLast7DaysData() {
      await ensureReady();
      const allAppts = await appointments.getAll();
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-IN', { weekday:'short' });
        const count = allAppts.filter(a => a.date === dateStr).length;
        result.push({ date: dateStr, label, count });
      }
      return result;
    },

    // Returns service popularity counts
    async getServiceStats() {
      await ensureReady();
      const allAppts = await appointments.getAll();
      const counts = {};
      for (const a of allAppts) {
        const svc = a.service || 'Unknown';
        counts[svc] = (counts[svc] || 0) + 1;
      }
      return Object.entries(counts)
        .sort((a,b) => b[1]-a[1])
        .map(([name, count]) => ({ name, count }));
    },

    // Monthly revenue for the current year
    async getMonthlyRevenue() {
      await ensureReady();
      const allAppts = await appointments.getAll();
      const year = new Date().getFullYear();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return months.map((month, i) => {
        const revenue = allAppts
          .filter(a => {
            const d = new Date(a.date);
            return d.getFullYear() === year && d.getMonth() === i && a.status === 'completed';
          })
          .reduce((s,a) => s + (a.price||0), 0);
        return { month, revenue };
      });
    }
  };

  // ─── EXPORT ───────────────────────────────────────────────────
  return { init, clients, appointments, chairs, admin };

})();

// Auto-initialize on page load
(async () => {
  try {
    await DB.init();
  } catch(err) {
    console.error('[SalonEase DB] Initialization failed:', err);
  }
})();
