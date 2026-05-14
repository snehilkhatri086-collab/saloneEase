/**
 * ═══════════════════════════════════════════════════════════════
 *  SALONEASE — APPLICATION LOGIC  (app.js)
 *
 *  All UI interactions, page routing, booking flow,
 *  admin dashboard, and data rendering.
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   SERVICES CATALOGUE
───────────────────────────────────────────────────────────── */
const SERVICES = [
  { id:'svc1', icon:'✂️',  name:'Hair Cut & Style',   desc:'Precision cuts tailored to your face shape and style preferences by expert stylists.',  price:800,  duration:'45 min',  popular:true  },
  { id:'svc2', icon:'🎨',  name:'Hair Color',          desc:'Vibrant, long-lasting color using premium international brands with aftercare advice.',  price:1500, duration:'90 min',  popular:true  },
  { id:'svc3', icon:'💆‍♀️', name:'Spa Treatment',       desc:'Rejuvenating head-to-toe relaxation for body and mind in our tranquil spa suite.',     price:2000, duration:'60 min',  popular:false },
  { id:'svc4', icon:'💄',  name:'Bridal Makeup',        desc:'Flawless bridal looks crafted for your most special day. Includes trial session.',      price:4500, duration:'120 min', popular:true  },
  { id:'svc5', icon:'💅',  name:'Nail Art',             desc:'Creative nail designs from minimalist elegance to elaborate custom artistry.',           price:600,  duration:'45 min',  popular:false },
  { id:'svc6', icon:'🌿',  name:'Keratin Treatment',    desc:'Smooth, frizz-free hair with our premium salon-grade keratin formula.',                 price:3200, duration:'180 min', popular:false },
  { id:'svc7', icon:'👁️',  name:'Eyebrow Threading',   desc:'Perfectly shaped brows that beautifully frame your natural features.',                  price:150,  duration:'15 min',  popular:false },
  { id:'svc8', icon:'✨',  name:'Facial & Cleanup',     desc:'Deep cleansing and brightening facial for glowing, radiant skin.',                      price:1200, duration:'60 min',  popular:false },
];

const ALL_TIME_SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM',
  '03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM',
];

/* ─────────────────────────────────────────────────────────────
   BOOKING STATE
───────────────────────────────────────────────────────────── */
let bookingState = {
  step: 1,
  selectedServices: [],
  selectedTime: '',
};

function resetBookingState() {
  bookingState = { step:1, selectedServices:[], selectedTime:'' };
}

/* ─────────────────────────────────────────────────────────────
   PAGE ROUTING
───────────────────────────────────────────────────────────── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top:0, behavior:'smooth' });
  }
  switch (name) {
    case 'home':          initHomePage();           break;
    case 'services':      initServicesPage();       break;
    case 'chairs':        initChairsPage();         break;
    case 'booking':       initBookingPage();        break;
    case 'client-portal': initClientPortal();       break;
    case 'admin':         initAdminPage();          break;
  }
}

function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'absolute';
  links.style.top = '70px';
  links.style.right = '0';
  links.style.left = '0';
  links.style.background = 'rgba(250,247,242,.97)';
  links.style.padding = '16px 24px';
  links.style.borderBottom = '1px solid var(--gold-light)';
  links.style.zIndex = '1000';
}

/* ─────────────────────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────────────────────── */
async function initHomePage() {
  await renderHeroChairs();
  await updateHeroBookingCount();
}

async function renderHeroChairs() {
  const grid = document.getElementById('hero-chairs-grid');
  if (!grid) return;
  const allChairs = await DB.chairs.getAll();
  grid.innerHTML = allChairs.map(c => `
    <div class="hcg-item ${c.status}" onclick="showPage('chairs')">
      <div class="icon">💺</div>
      <div>C${c.id}</div>
    </div>
  `).join('');

  // Next available slot
  const today = new Date().toISOString().split('T')[0];
  const booked = await DB.appointments.getBookedTimes(today);
  const next = ALL_TIME_SLOTS.find(t => !booked.includes(t));
  const el = document.getElementById('hero-next-slot');
  if (el) el.textContent = next || 'Fully booked';
}

async function updateHeroBookingCount() {
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = await DB.appointments.getByDate(today);
  const el = document.getElementById('hero-booking-count');
  if (el) el.textContent = todayAppts.length;
}

/* ─────────────────────────────────────────────────────────────
   SERVICES PAGE
───────────────────────────────────────────────────────────── */
function initServicesPage() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card">
      ${s.popular ? '<div style="position:absolute;top:16px;right:16px;background:var(--gold-pale);color:var(--gold-dark);font-size:10px;padding:3px 10px;border-radius:50px;font-weight:500;letter-spacing:1px;text-transform:uppercase">Popular</div>' : ''}
      <div class="svc-icon">${s.icon}</div>
      <div class="svc-name">${s.name}</div>
      <div class="svc-desc">${s.desc}</div>
      <div class="svc-meta">
        <div class="svc-price">₹${s.price.toLocaleString('en-IN')}</div>
        <div class="svc-dur">⏱ ${s.duration}</div>
      </div>
      <button class="svc-book-btn" onclick="quickBook('${s.id}')">Book This Service</button>
    </div>
  `).join('');
}

function quickBook(svcId) {
  showPage('booking');
  setTimeout(() => {
    const pill = document.querySelector(`.svc-pill[data-id="${svcId}"]`);
    if (pill) {
      pill.classList.add('selected');
      updateBookingState();
    }
  }, 200);
}

/* ─────────────────────────────────────────────────────────────
   CHAIRS PAGE
───────────────────────────────────────────────────────────── */
async function initChairsPage() {
  await renderChairsFloor();
  // Auto-refresh every 30s
  clearInterval(window._chairRefreshTimer);
  window._chairRefreshTimer = setInterval(renderChairsFloor, 30000);
}

async function renderChairsFloor() {
  const grid = document.getElementById('chairs-floor-grid');
  if (!grid) return;
  const allChairs = await DB.chairs.getAll();

  grid.innerHTML = allChairs.map(c => `
    <div class="chair-tile ${c.status}" onclick="showChairDetail(${c.id})">
      <div class="ct-icon">💺</div>
      <div class="ct-id">${c.label}</div>
      <div class="ct-status">${capitalize(c.status)}</div>
      <div class="ct-stylist">${c.stylist}</div>
    </div>
  `).join('');

  const updEl = document.getElementById('chairs-updated');
  if (updEl) updEl.textContent = 'just now';
}

async function showChairDetail(chairId) {
  const panel = document.getElementById('chair-detail-panel');
  if (!panel) return;
  const chair = await DB.chairs.getById(chairId);
  if (!chair) return;
  const today = new Date().toISOString().split('T')[0];
  const allAppts = await DB.appointments.getAll();
  const chairAppts = allAppts.filter(a => a.chair === chair.label && a.date === today && a.status !== 'cancelled');

  const statusColor = { available:'#2e7d52', occupied:'#c0392b', reserved:'#b45309', maintenance:'#666' };

  panel.innerHTML = `
    <div class="cdp-title">${chair.label}</div>
    <div class="cdp-row"><span class="cdp-lbl">Status</span>
      <span class="cdp-val" style="color:${statusColor[chair.status] || '#666'};text-transform:capitalize;font-weight:600">${chair.status}</span></div>
    <div class="cdp-row"><span class="cdp-lbl">Stylist</span><span class="cdp-val">${chair.stylist}</span></div>
    <div class="cdp-row"><span class="cdp-lbl">Floor</span><span class="cdp-val">${chair.floor || 'Ground Level'}</span></div>
    <div class="cdp-row"><span class="cdp-lbl">Today's Queue</span><span class="cdp-val">${chairAppts.length} appointment${chairAppts.length !== 1 ? 's' : ''}</span></div>
    <div class="cdp-queue-title">Today's Schedule</div>
    ${chairAppts.length
      ? chairAppts.sort((a,b) => a.time.localeCompare(b.time)).map(a => `
        <div class="queue-entry">
          <div class="qa">${a.clientName[0]}</div>
          <div>
            <div class="qi-name">${a.clientName}</div>
            <div class="qi-svc">${a.service}</div>
          </div>
          <div class="qi-time">${a.time}</div>
        </div>`).join('')
      : '<div style="color:var(--muted);font-size:13px;padding:8px 0">No appointments today</div>'
    }
    <button class="btn-primary" style="width:100%;margin-top:24px;display:block;text-align:center"
      onclick="preSelectChair('${chair.label}')">
      Book This Chair
    </button>
  `;
}

function preSelectChair(label) {
  showPage('booking');
  setTimeout(() => {
    const sel = document.getElementById('f-chair');
    if (sel) sel.value = label;
    updateBookingState();
  }, 200);
}

/* ─────────────────────────────────────────────────────────────
   BOOKING PAGE
───────────────────────────────────────────────────────────── */
function initBookingPage() {
  resetBookingState();
  renderServicePills();
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('f-date');
  if (dateInput) { dateInput.min = today; dateInput.value = today; }
  refreshTimeSlots();
  updateBookingSummary();
  updateAvailChart();
  showFormStep(1);

  // Attach live listeners
  const liveInputIds = ['f-fname','f-lname','f-email','f-stylist','f-date','f-chair'];
  liveInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateBookingSummary);
    if (el) el.addEventListener('change', updateBookingSummary);
  });
}

function renderServicePills() {
  const container = document.getElementById('service-pills');
  if (!container) return;
  container.innerHTML = SERVICES.map(s => `
    <div class="svc-pill" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}"
         onclick="toggleServicePill(this)">
      ${s.icon} ${s.name}
    </div>
  `).join('');
}

function toggleServicePill(el) {
  el.classList.toggle('selected');
  updateBookingState();
  updateBookingSummary();
}

function updateBookingState() {
  const pills = document.querySelectorAll('.svc-pill.selected');
  bookingState.selectedServices = Array.from(pills).map(p => ({
    id: p.dataset.id, name: p.dataset.name, price: parseInt(p.dataset.price)
  }));
}

async function refreshTimeSlots() {
  const grid = document.getElementById('time-slots-grid');
  if (!grid) return;
  const dateInput = document.getElementById('f-date');
  const dateVal = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  const bookedTimes = await DB.appointments.getBookedTimes(dateVal);

  grid.innerHTML = ALL_TIME_SLOTS.map(t => {
    const isBooked = bookedTimes.includes(t);
    return `
      <div class="ts-slot${isBooked ? ' booked' : ''}"
           onclick="${isBooked ? '' : `selectTimeSlot(this, '${t}')`}"
           title="${isBooked ? 'This slot is already booked' : ''}">
        ${t}
      </div>`;
  }).join('');

  bookingState.selectedTime = '';
  updateBookingSummary();
}

function selectTimeSlot(el, time) {
  document.querySelectorAll('.ts-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  bookingState.selectedTime = time;
  updateBookingSummary();
}

function updateBookingSummary() {
  const fname  = val('f-fname');
  const lname  = val('f-lname');
  const email  = val('f-email');
  const stylist= val('f-stylist') || 'Auto-assigned';
  const date   = val('f-date');
  const chair  = val('f-chair') || 'Auto-assigned';
  const total  = bookingState.selectedServices.reduce((s,x) => s+x.price, 0);
  const svcNames = bookingState.selectedServices.map(s=>s.name).join(', ') || '—';

  setText('sum-name',    (fname+' '+lname).trim() || '—');
  setText('sum-email',   email || '—');
  setText('sum-service', svcNames);
  setText('sum-stylist', stylist);
  setText('sum-date',    date ? formatDate(date) : '—');
  setText('sum-time',    bookingState.selectedTime || '—');
  setText('sum-chair',   chair);
  setText('sum-total',   '₹'+total.toLocaleString('en-IN'));
}

async function updateAvailChart() {
  const container = document.getElementById('avail-chart');
  if (!container) return;
  const chairs = await DB.chairs.getAll();
  const total = chairs.length;
  const statusCounts = { available:0, occupied:0, reserved:0, maintenance:0 };
  chairs.forEach(c => statusCounts[c.status] = (statusCounts[c.status]||0)+1);
  container.innerHTML = Object.entries(statusCounts)
    .filter(([,count]) => count > 0)
    .map(([status, count]) => `
      <div class="avail-row">
        <span style="text-transform:capitalize;min-width:90px;font-size:13px;color:var(--muted)">${status}</span>
        <div class="avail-bar-wrap">
          <div class="avail-bar" style="width:${(count/total)*100}%;background:${
            status==='available'?'var(--sage)':status==='occupied'?'var(--rose)':status==='reserved'?'var(--gold)':'#ccc'
          }"></div>
        </div>
        <span style="min-width:20px;text-align:right;font-size:13px;color:var(--muted)">${count}</span>
      </div>`).join('');
}

/* ── STEP NAVIGATION ─────────────────────────────────────────── */
function showFormStep(n) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('step-' + n);
  if (target) target.classList.add('active');
  bookingState.step = n;

  // Update step circles
  for (let i = 1; i <= 4; i++) {
    const circle = document.getElementById('sc-' + i);
    const item   = document.getElementById('si-' + i);
    const track  = document.getElementById('st-' + i);
    if (!circle) continue;
    circle.classList.remove('done','active');
    item.classList.remove('done','active');
    if (i < n) { circle.innerHTML = '✓'; circle.classList.add('done'); item.classList.add('done'); }
    else if (i === n) { circle.innerHTML = i; circle.classList.add('active'); item.classList.add('active'); }
    else { circle.innerHTML = i; }
    if (track) track.classList.toggle('done', i < n);
  }
}

function goStep(n) {
  if (n > bookingState.step) {
    if (!validateStep(bookingState.step)) return;
    if (n === 4) buildReviewBox();
  }
  showFormStep(n);
  updateBookingSummary();
}

function validateStep(step) {
  if (step === 1) {
    if (!val('f-fname').trim()) { showToast('Please enter your first name', 'error'); return false; }
    if (!val('f-email').trim()) { showToast('Please enter your email address', 'error'); return false; }
    if (!isValidEmail(val('f-email'))) { showToast('Please enter a valid email', 'error'); return false; }
    if (!val('f-phone').trim()) { showToast('Please enter your phone number', 'error'); return false; }
    return true;
  }
  if (step === 2) {
    updateBookingState();
    if (bookingState.selectedServices.length === 0) {
      showToast('Please select at least one service', 'error'); return false;
    }
    return true;
  }
  if (step === 3) {
    if (!bookingState.selectedTime) {
      showToast('Please select a time slot', 'error'); return false;
    }
    return true;
  }
  return true;
}

function buildReviewBox() {
  const box = document.getElementById('review-box');
  if (!box) return;
  const fname  = val('f-fname');
  const lname  = val('f-lname');
  const email  = val('f-email');
  const phone  = val('f-phone');
  const date   = val('f-date');
  const stylist= val('f-stylist') || 'Auto-assigned';
  const chair  = val('f-chair') || 'Auto-assigned';
  const notes  = val('f-notes');
  const total  = bookingState.selectedServices.reduce((s,x) => s+x.price, 0);

  box.innerHTML = `
    <div class="rv-item"><div class="rv-lbl">Client</div><div class="rv-val">${fname} ${lname}</div></div>
    <div class="rv-item"><div class="rv-lbl">Email</div><div class="rv-val">${email}</div></div>
    <div class="rv-item"><div class="rv-lbl">Phone</div><div class="rv-val">${phone}</div></div>
    <div class="rv-item"><div class="rv-lbl">Date</div><div class="rv-val">${formatDate(date)}</div></div>
    <div class="rv-item"><div class="rv-lbl">Time</div><div class="rv-val">${bookingState.selectedTime}</div></div>
    <div class="rv-item"><div class="rv-lbl">Stylist</div><div class="rv-val">${stylist}</div></div>
    <div class="rv-item"><div class="rv-lbl">Chair</div><div class="rv-val">${chair}</div></div>
    <div class="rv-item full-width">
      <div class="rv-lbl">Services</div>
      <div class="rv-val">${bookingState.selectedServices.map(s=>`${s.name} (₹${s.price.toLocaleString('en-IN')})`).join(' + ')}</div>
    </div>
    ${notes ? `<div class="rv-item full-width"><div class="rv-lbl">Notes</div><div class="rv-val">${notes}</div></div>` : ''}
    <div class="rv-item full-width" style="border-top:1px solid var(--gold-light);padding-top:12px;margin-top:4px">
      <div class="rv-lbl">Total Amount</div>
      <div class="rv-val" style="font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--gold)">₹${total.toLocaleString('en-IN')}</div>
    </div>
  `;
}

async function submitBooking() {
  if (!validateStep(3)) return;
  updateBookingState();

  const fname   = val('f-fname');
  const lname   = val('f-lname');
  const email   = val('f-email');
  const phone   = val('f-phone');
  const date    = val('f-date');
  const stylist = val('f-stylist') || 'Auto-assigned';
  const chair   = val('f-chair') || autoAssignChair();
  const notes   = val('f-notes');
  const payment = val('f-payment');
  const total   = bookingState.selectedServices.reduce((s,x) => s+x.price, 0);
  const svcNames= bookingState.selectedServices.map(s=>s.name).join(', ');

  try {
    const appt = await DB.appointments.add({
      name:    `${fname} ${lname}`,
      email, phone, date,
      time:    bookingState.selectedTime,
      service: svcNames,
      stylist, chair, notes, payment, price: total
    });

    // Show confirmation screen
    document.querySelector('.booking-form-wrap').style.display = 'none';
    const confScreen = document.getElementById('confirmation-screen');
    confScreen.classList.add('active');
    document.getElementById('conf-id').textContent = `Booking ID: ${appt.id}`;
    document.getElementById('conf-details-box').innerHTML = `
      <div class="cdp-row"><span class="cdp-lbl">Service</span><span class="cdp-val">${svcNames}</span></div>
      <div class="cdp-row"><span class="cdp-lbl">Date & Time</span><span class="cdp-val">${formatDate(date)} at ${bookingState.selectedTime}</span></div>
      <div class="cdp-row"><span class="cdp-lbl">Stylist</span><span class="cdp-val">${stylist}</span></div>
      <div class="cdp-row"><span class="cdp-lbl">Chair</span><span class="cdp-val">${chair}</span></div>
      <div class="cdp-row"><span class="cdp-lbl">Payment</span><span class="cdp-val">${paymentLabel(payment)}</span></div>
      <div class="cdp-row" style="border:none"><span class="cdp-lbl">Total</span><span class="cdp-val" style="font-family:'Cormorant Garamond',serif;font-size:24px;color:var(--gold)">₹${total.toLocaleString('en-IN')}</span></div>
    `;

    showToast('Appointment confirmed! 🎉', 'success');
  } catch (err) {
    console.error('Booking error:', err);
    showToast('Booking failed. Please try again.', 'error');
  }
}

function resetBooking() {
  resetBookingState();
  document.querySelector('.booking-form-wrap').style.display = '';
  document.getElementById('confirmation-screen').classList.remove('active');
  initBookingPage();
}

function autoAssignChair() {
  return 'Chair ' + Math.floor(Math.random() * 8 + 1);
}

/* ─────────────────────────────────────────────────────────────
   CLIENT PORTAL
───────────────────────────────────────────────────────────── */
function initClientPortal() {}

async function lookupClientBookings() {
  const email = document.getElementById('portal-email').value.trim();
  const resultsEl = document.getElementById('portal-results');
  if (!email) { showToast('Please enter an email address', 'error'); return; }
  if (!isValidEmail(email)) { showToast('Please enter a valid email', 'error'); return; }

  resultsEl.innerHTML = '<div class="portal-placeholder">Searching...</div>';

  const appts = await DB.appointments.getByEmail(email);
  const client = await DB.clients.getByEmail(email);

  if (appts.length === 0) {
    resultsEl.innerHTML = `
      <div class="portal-placeholder">
        No bookings found for <strong>${email}</strong>.<br>
        <a href="#" onclick="showPage('booking')" style="color:var(--gold);text-decoration:underline">Book an appointment</a>
      </div>`;
    return;
  }

  const sorted = appts.sort((a,b) => new Date(b.date) - new Date(a.date));
  const totalSpent = appts.reduce((s,a) => s+(a.price||0), 0);

  resultsEl.innerHTML = `
    <div style="background:white;border-radius:var(--radius);padding:20px 24px;margin-bottom:20px;box-shadow:var(--shadow-sm);border:1px solid var(--gold-light)">
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;margin-bottom:4px">${client ? client.name : appts[0].clientName}</div>
      <div style="font-size:13px;color:var(--muted)">${email} · ${appts.length} booking${appts.length!==1?'s':''} · Total spent: ₹${totalSpent.toLocaleString('en-IN')}</div>
    </div>
    ${sorted.map(a => `
      <div class="portal-appt-card">
        <div class="pac-head">
          <div class="pac-service">${a.service}</div>
          <span class="badge ${a.status}">${a.status}</span>
        </div>
        <div class="pac-grid">
          <div class="pac-item"><div class="lbl">Date</div>${formatDate(a.date)}</div>
          <div class="pac-item"><div class="lbl">Time</div>${a.time}</div>
          <div class="pac-item"><div class="lbl">Stylist</div>${a.stylist}</div>
          <div class="pac-item"><div class="lbl">Chair</div>${a.chair}</div>
          <div class="pac-item"><div class="lbl">Amount</div>₹${(a.price||0).toLocaleString('en-IN')}</div>
          <div class="pac-item"><div class="lbl">Booking ID</div><span style="font-size:12px;color:var(--muted)">${a.id}</span></div>
          ${a.notes ? `<div class="pac-item" style="grid-column:1/-1"><div class="lbl">Notes</div>${a.notes}</div>` : ''}
        </div>
      </div>`).join('')}
  `;
}

/* ─────────────────────────────────────────────────────────────
   ADMIN PAGE
───────────────────────────────────────────────────────────── */
function initAdminPage() {
  // Reset to login if not logged in
  if (!window._adminLoggedIn) {
    document.getElementById('admin-login-wrap').style.display = 'flex';
    document.getElementById('admin-dashboard').classList.add('hidden');
  }
}

async function adminLogin() {
  const username = document.getElementById('adm-user').value.trim();
  const password = document.getElementById('adm-pass').value.trim();
  if (!username || !password) { showToast('Enter your credentials', 'error'); return; }
  const valid = await DB.admin.verify(username, password);
  if (!valid) { showToast('Invalid username or password', 'error'); return; }

  window._adminLoggedIn = true;
  document.getElementById('admin-login-wrap').style.display = 'none';
  document.getElementById('admin-dashboard').classList.remove('hidden');
  await loadAdminDashboard();
}

function adminLogout() {
  window._adminLoggedIn = false;
  document.getElementById('admin-login-wrap').style.display = 'flex';
  document.getElementById('admin-dashboard').classList.add('hidden');
  document.getElementById('adm-user').value = '';
  document.getElementById('adm-pass').value = '';
}

async function loadAdminDashboard() {
  await renderAdminStats();
  await renderAdminAppointments();
  await renderAdminChairs();
  await renderAdminClients();
  await renderAdminAnalytics();
}

/* ── STATS ───────────────────────────────────────────────────── */
async function renderAdminStats() {
  const stats = await DB.admin.getStats();
  const row = document.getElementById('adm-stats-row');
  if (!row) return;
  row.innerHTML = `
    <div class="adm-stat-card">
      <div class="asc-icon">📅</div>
      <div class="asc-num">${stats.todayCount}</div>
      <div class="asc-lbl">Today's Appointments</div>
    </div>
    <div class="adm-stat-card">
      <div class="asc-icon">⏳</div>
      <div class="asc-num">${stats.pendingCount}</div>
      <div class="asc-lbl">Pending Confirmations</div>
    </div>
    <div class="adm-stat-card">
      <div class="asc-icon">💺</div>
      <div class="asc-num">${stats.availableChairs}</div>
      <div class="asc-lbl">Available Chairs</div>
    </div>
    <div class="adm-stat-card">
      <div class="asc-icon">💰</div>
      <div class="asc-num">₹${stats.todayRevenue.toLocaleString('en-IN')}</div>
      <div class="asc-lbl">Today's Revenue</div>
    </div>
  `;
}

/* ── APPOINTMENTS TABLE ──────────────────────────────────────── */
async function renderAdminAppointments() {
  const tbody = document.getElementById('adm-appt-tbody');
  if (!tbody) return;

  let appts = await DB.appointments.getAll();

  // Filters
  const statusFilter = document.getElementById('adm-filter-status')?.value || 'all';
  const dateFilter   = document.getElementById('adm-filter-date')?.value || '';

  if (statusFilter !== 'all') appts = appts.filter(a => a.status === statusFilter);
  if (dateFilter)              appts = appts.filter(a => a.date === dateFilter);

  appts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (appts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:32px;color:rgba(255,255,255,.3)">No appointments found</td></tr>';
    return;
  }

  tbody.innerHTML = appts.map(a => `
    <tr>
      <td class="muted">${a.id}</td>
      <td>
        <div style="font-weight:500">${a.clientName}</div>
        <div class="muted">${a.clientEmail}</div>
      </td>
      <td>${a.service}</td>
      <td>
        <div>${formatDate(a.date)}</div>
        <div class="muted">${a.date === new Date().toISOString().split('T')[0] ? 'Today' : ''}</div>
      </td>
      <td>${a.time}</td>
      <td>${a.chair}</td>
      <td>${a.stylist}</td>
      <td style="color:var(--gold)">₹${(a.price||0).toLocaleString('en-IN')}</td>
      <td><span class="badge ${a.status}">${a.status}</span></td>
      <td>
        <button class="tbl-btn edit" onclick="openEditModal('${a.id}')">✎ Edit</button>
        <button class="tbl-btn del"  onclick="deleteAppointment('${a.id}')">✕</button>
      </td>
    </tr>
  `).join('');
}

/* ── CHAIR MANAGEMENT ────────────────────────────────────────── */
async function renderAdminChairs() {
  await refreshChairsDisplay();
}

async function refreshChairsDisplay() {
  const grid = document.getElementById('chairs-mgmt-grid');
  if (!grid) return;
  const allChairs = await DB.chairs.getAll();
  grid.innerHTML = allChairs.map(c => `
    <div class="chair-mgmt-card">
      <div class="cmc-icon">💺</div>
      <div class="cmc-id">${c.label}</div>
      <div class="cmc-stylist">${c.stylist}</div>
      <span class="cmc-badge ${c.status}">${capitalize(c.status)}</span><br>
      <button class="cmc-edit-btn" onclick="openChairEditModal(${c.id})">✎ Edit Chair</button>
    </div>
  `).join('');
}

/* ── CLIENT RECORDS ──────────────────────────────────────────── */
async function renderAdminClients() {
  const tbody = document.getElementById('adm-clients-tbody');
  if (!tbody) return;
  let clients = await DB.clients.getAll();

  const search = document.getElementById('adm-client-search')?.value.toLowerCase() || '';
  if (search) clients = clients.filter(c =>
    c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search)
  );

  const allAppts = await DB.appointments.getAll();

  if (clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:rgba(255,255,255,.3)">No clients found</td></tr>';
    return;
  }

  tbody.innerHTML = clients.map(c => {
    const clientAppts = allAppts.filter(a => a.clientEmail === c.email);
    const lastVisit = clientAppts.sort((a,b) => new Date(b.date)-new Date(a.date))[0];
    return `
      <tr>
        <td><div style="font-weight:500">${c.name}</div></td>
        <td class="muted">${c.email}</td>
        <td class="muted">${c.phone || '—'}</td>
        <td style="text-align:center">${clientAppts.length}</td>
        <td style="color:var(--gold)">₹${(c.totalSpent||0).toLocaleString('en-IN')}</td>
        <td class="muted">${lastVisit ? formatDate(lastVisit.date) : 'Never'}</td>
      </tr>`;
  }).join('');
}

/* ── ANALYTICS ───────────────────────────────────────────────── */
async function renderAdminAnalytics() {
  await renderRevenueChart();
  await renderPopularServices();
  await renderBookingBarChart();
}

async function renderRevenueChart() {
  const container = document.getElementById('revenue-chart');
  if (!container) return;
  const monthlyData = await DB.admin.getMonthlyRevenue();
  const maxRev = Math.max(...monthlyData.map(m => m.revenue), 1);

  container.innerHTML = monthlyData
    .filter(m => m.revenue > 0 || new Date().getMonth() >= monthlyData.indexOf(m))
    .slice(-6)
    .map(m => `
      <div class="rc-row">
        <span class="rc-lbl">${m.month}</span>
        <div class="rc-bar-wrap">
          <div class="rc-bar" style="width:${(m.revenue/maxRev)*100}%"></div>
        </div>
        <span class="rc-val">₹${m.revenue > 0 ? (m.revenue/1000).toFixed(1)+'k' : '0'}</span>
      </div>`).join('');
}

async function renderPopularServices() {
  const container = document.getElementById('popular-services-list');
  if (!container) return;
  const stats = await DB.admin.getServiceStats();
  const max = stats[0]?.count || 1;
  const svcIcons = { 'Hair Cut & Style':'✂️','Hair Color':'🎨','Spa Treatment':'💆‍♀️','Bridal Makeup':'💄','Nail Art':'💅','Keratin Treatment':'🌿','Eyebrow Threading':'👁️','Facial & Cleanup':'✨' };

  container.innerHTML = stats.slice(0,6).map(s => `
    <div class="ps-item">
      <span class="ps-icon">${svcIcons[s.name] || '✦'}</span>
      <span class="ps-name">${s.name}</span>
      <div class="ps-bar-wrap"><div class="ps-bar" style="width:${(s.count/max)*100}%"></div></div>
      <span class="ps-count">${s.count}×</span>
    </div>`).join('') || '<div style="color:rgba(255,255,255,.3);text-align:center;padding:20px">No data yet</div>';
}

async function renderBookingBarChart() {
  const container = document.getElementById('booking-bar-chart');
  if (!container) return;
  const data = await DB.admin.getLast7DaysData();
  const max = Math.max(...data.map(d => d.count), 1);

  container.innerHTML = `
    <div class="bar-chart-wrap">
      ${data.map(d => `
        <div class="bc-bar-wrap">
          <div class="bc-val">${d.count || ''}</div>
          <div class="bc-bar" style="height:${Math.max((d.count/max)*120, d.count>0?8:0)}px"></div>
          <div class="bc-lbl">${d.label}</div>
        </div>`).join('')}
    </div>`;
}

/* ── TABS ────────────────────────────────────────────────────── */
function switchAdmTab(name, btn) {
  document.querySelectorAll('.adm-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.adm-tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById('adm-tab-' + name);
  if (target) target.classList.add('active');
}

/* ── EDIT APPOINTMENT MODAL ──────────────────────────────────── */
async function openEditModal(id) {
  const appt = await DB.appointments.getById(id);
  if (!appt) return;
  document.getElementById('modal-appt-id').value = id;
  document.getElementById('modal-client').value  = appt.clientName;
  document.getElementById('modal-date').value    = appt.date;
  // Convert "09:30 AM" to "09:30" for <input type="time">
  document.getElementById('modal-time').value    = convertTo24h(appt.time);
  document.getElementById('modal-chair').value   = appt.chair;
  document.getElementById('modal-stylist').value = appt.stylist;
  document.getElementById('modal-status').value  = appt.status;
  document.getElementById('modal-admin-notes').value = appt.adminNotes || '';
  openModal('modal-edit-appt');
}

async function saveEditedAppointment() {
  const id      = document.getElementById('modal-appt-id').value;
  const date    = document.getElementById('modal-date').value;
  const time24  = document.getElementById('modal-time').value;
  const chair   = document.getElementById('modal-chair').value;
  const stylist = document.getElementById('modal-stylist').value;
  const status  = document.getElementById('modal-status').value;
  const notes   = document.getElementById('modal-admin-notes').value;

  if (!id || !date || !time24) { showToast('Please fill in all required fields', 'error'); return; }

  const time12 = convertTo12h(time24);
  await DB.appointments.update(id, { date, time:time12, chair, stylist, status, adminNotes:notes });
  closeModal('modal-edit-appt');
  await loadAdminDashboard();
  showToast('Appointment updated successfully ✓', 'success');
}

async function deleteAppointment(id) {
  if (!confirm('Are you sure you want to delete this appointment?')) return;
  await DB.appointments.delete(id);
  await loadAdminDashboard();
  showToast('Appointment deleted', 'info');
}

/* ── ADD APPOINTMENT FROM ADMIN ──────────────────────────────── */
function openAddAppointmentModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('ma-date').value = today;
  openModal('modal-add-appt');
}

async function addAppointmentFromAdmin() {
  const name    = document.getElementById('ma-name').value.trim();
  const email   = document.getElementById('ma-email').value.trim();
  const phone   = document.getElementById('ma-phone').value.trim();
  const svcRaw  = document.getElementById('ma-service').value;
  const date    = document.getElementById('ma-date').value;
  const time24  = document.getElementById('ma-time').value;
  const chair   = document.getElementById('ma-chair').value;
  const stylist = document.getElementById('ma-stylist').value;

  if (!name || !email || !svcRaw || !date || !time24) {
    showToast('Please fill in all required fields', 'error'); return;
  }

  const [svcName, priceStr] = svcRaw.split('|');
  const price = parseInt(priceStr) || 0;

  await DB.appointments.add({
    name, email, phone, service: svcName,
    date, time: convertTo12h(time24), chair, stylist, price,
    payment: 'pay-at-salon', status: 'confirmed'
  });

  closeModal('modal-add-appt');
  await loadAdminDashboard();
  showToast('Appointment added ✓', 'success');
}

/* ── CHAIR EDIT MODAL ────────────────────────────────────────── */
async function openChairEditModal(id) {
  const chair = await DB.chairs.getById(id);
  if (!chair) return;
  document.getElementById('mc-chair-id').value = id;
  document.getElementById('mc-label').value    = chair.label;
  document.getElementById('mc-stylist').value  = chair.stylist;
  document.getElementById('mc-status').value   = chair.status;
  openModal('modal-edit-chair');
}

async function saveChairEdit() {
  const id      = parseInt(document.getElementById('mc-chair-id').value);
  const label   = document.getElementById('mc-label').value.trim();
  const stylist = document.getElementById('mc-stylist').value;
  const status  = document.getElementById('mc-status').value;

  await DB.chairs.update(id, { label, stylist, status });
  closeModal('modal-edit-chair');
  await refreshChairsDisplay();
  await renderAdminStats();
  await renderHeroChairs();
  showToast('Chair updated ✓', 'success');
}

/* ─────────────────────────────────────────────────────────────
   MODAL HELPERS
───────────────────────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

/* ─────────────────────────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────────────────────────── */
let _toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const icons = { success:'✓', error:'⚠', info:'ℹ' };
  toast.innerHTML = `<span>${icons[type]||'•'}</span> ${message}`;
  toast.className = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ─────────────────────────────────────────────────────────────
   UTILITY FUNCTIONS
───────────────────────────────────────────────────────────── */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  } catch { return dateStr; }
}

function paymentLabel(key) {
  const map = { 'pay-at-salon':'Pay at Salon', 'upi':'UPI', 'card':'Card', 'wallet':'Wallet' };
  return map[key] || key;
}

function convertTo24h(time12) {
  if (!time12) return '';
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12;
  let [, h, m, period] = match;
  h = parseInt(h);
  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${m}`;
}

function convertTo12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
}

/* ─────────────────────────────────────────────────────────────
   BOOTSTRAP
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  showPage('home');
});
