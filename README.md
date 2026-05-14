# 💇 SalonEase – Luxury Salon Management System

A complete salon management and online booking website with two separate databases.

---

## 🗂 Project Structure

```
salonease/
├── index.html       — Main HTML (all pages in one file)
├── style.css        — Complete stylesheet
├── database.js      — Browser IndexedDB layer (frontend database)
├── app.js           — All UI logic and interactions
├── server.js        — Node.js REST API backend (optional)
├── package.json     — Node.js dependencies
└── README.md        — This file
```

---

## 🚀 Quick Start (Frontend Only)

Just open `index.html` in any browser — no server needed.

The site uses **IndexedDB** (a real browser database) to persist all data locally.

```bash
# Open directly
open index.html
# Or serve with any static server
npx serve .
```

---

## 🖥 Full Stack Setup (With Node.js Backend)

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open browser
open http://localhost:3000
```

The server creates two SQLite database files automatically:
- `client.db`  — Client profiles and their appointments
- `admin.db`   — Admin appointments, chairs, and settings

---

## 🗄 Database Architecture

### CLIENT DATABASE (`client.db` / IndexedDB: `SalonEase_ClientDB`)

**`clients` table**
| Column       | Type    | Description                     |
|-------------|---------|----------------------------------|
| id          | INT/PK  | Auto-increment primary key       |
| name        | TEXT    | Full client name                 |
| email       | TEXT    | Unique email address             |
| phone       | TEXT    | Contact number                   |
| created_at  | TEXT    | Registration timestamp           |
| total_spent | INT     | Cumulative spending              |
| visit_count | INT     | Number of visits                 |

**`client_appointments` table**
| Column       | Type    | Description                     |
|-------------|---------|----------------------------------|
| id          | TEXT/PK | Booking ID (e.g. SE1ABC23)       |
| client_email| TEXT    | Foreign key → clients.email      |
| client_name | TEXT    | Client display name              |
| service     | TEXT    | Service(s) booked                |
| date        | TEXT    | Appointment date (YYYY-MM-DD)    |
| time        | TEXT    | Time slot (e.g. 10:30 AM)        |
| chair       | TEXT    | Assigned chair                   |
| stylist     | TEXT    | Assigned stylist                 |
| notes       | TEXT    | Client special requests          |
| payment     | TEXT    | Payment method                   |
| price       | INT     | Total amount in INR              |
| status      | TEXT    | confirmed/pending/completed/cancelled |

---

### ADMIN DATABASE (`admin.db` / IndexedDB: `SalonEase_AdminDB`)

**`appointments` table** (superset of client appointments)
| Column       | Type    | Description                     |
|-------------|---------|----------------------------------|
| id          | TEXT/PK | Same booking ID                  |
| admin_notes | TEXT    | Internal admin notes             |
| updated_at  | TEXT    | Last modification timestamp      |
| ...         | ...     | All fields from client table     |

**`chairs` table**
| Column  | Type    | Description                           |
|---------|---------|---------------------------------------|
| id      | INT/PK  | Chair number (1–8)                    |
| label   | TEXT    | Display name (e.g. "Chair 1")         |
| stylist | TEXT    | Assigned stylist name                 |
| status  | TEXT    | available/occupied/reserved/maintenance |
| floor   | TEXT    | Floor location                        |

**`settings` table**
| Key                  | Value (JSON)                        |
|---------------------|-------------------------------------|
| admin_credentials   | `{"username":"admin","password":"salon123"}` |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 Home | Live chair availability preview, booking count, hero stats |
| 💇 Services | 8 service cards with pricing, duration, quick-book buttons |
| 💺 Chairs | Real-time floor map with stylist info and today's queue per chair |
| 📅 Booking | 4-step booking wizard with live summary sidebar and time-slot availability |
| 👤 Client Portal | Email lookup to view complete booking history |
| 🔐 Admin Login | Secure admin portal (admin / salon123) |
| 📊 Dashboard | Stats cards, appointment table with filters, analytics charts |
| ✎ Edit Appointments | Adjust date, time, chair, stylist, status via modal |
| ➕ Add Appointments | Admin can create appointments manually |
| 🪑 Chair Management | Edit chair status and stylist assignment |
| 👥 Client Records | Full client database with spending and visit history |
| 📈 Analytics | Revenue chart, popular services, 7-day booking trends |

---

## 🔑 Default Admin Credentials
```
Username: admin
Password: salon123
```

---

## 🌐 API Endpoints (Backend Mode)

```
GET    /api/services              — Services catalogue
GET    /api/slots?date=YYYY-MM-DD — Available time slots
GET    /api/chairs                — Chair availability
GET    /api/bookings/:email        — Client booking history
POST   /api/book                  — Submit booking

POST   /api/admin/login                   — Admin auth
GET    /api/admin/appointments            — All appointments
POST   /api/admin/appointments            — Add appointment
PUT    /api/admin/appointments/:id        — Edit appointment
DELETE /api/admin/appointments/:id        — Delete appointment
GET    /api/admin/clients                 — Client database
GET    /api/admin/chairs                  — Chair list
PUT    /api/admin/chairs/:id              — Edit chair
GET    /api/admin/stats                   — Dashboard stats
GET    /api/admin/analytics               — Charts & trends
```
