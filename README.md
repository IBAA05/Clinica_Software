<div align="center">

<br />

```
   ___  _  _         _               
  / __|| |(_) _ __  (_) __  __ _     
 | /   | || || '_ \ | |/ _|/ _` |    
 | \__ | || || | | || | (__| (_| |   
  \___||_||_||_| |_||_|\___|\__,_|   
                                     
        S  O  F  T  W  A  R  E
```

### **The all-in-one clinic management platform for private medical practices**

<br />

![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-async-D71F00?style=for-the-badge&logo=python&logoColor=white)

<br />

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Roles & Permissions](#-roles--permissions)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🌐 Overview

**Clinica Software** is a comprehensive, production-ready clinic management system built exclusively for private single-doctor medical practices. It brings every operational and clinical workflow into one unified, elegant platform — from patient registration and appointment scheduling to treatment records, prescription generation, invoicing, and deep financial analytics.

Designed with a clean medical-grade aesthetic and powered by a robust async backend, Clinica eliminates administrative friction and gives the doctor full visibility into both clinical and business performance, while allowing receptionists to manage day-to-day operations seamlessly within their permitted scope.

> *Built for the doctor who demands excellence — in care and in operations.*

---

## ✨ Features

### 🔐 Authentication & Access Control
- Secure JWT-based login with access token and refresh token strategy
- Two-role system: **Doctor (Owner)** and **Receptionist**
- Auto token refresh on expiry via Axios interceptors
- Per-route and per-field role enforcement throughout the platform
- Staff account management by doctor only

---

### 📊 Dashboard
- Live animated stat counters: total patients, today's appointments, monthly revenue, pending invoices
- Today's appointment schedule — chronological timeline with status action buttons
- Patient and appointment trend — combined area + line chart (12 months)
- Revenue by service type donut chart (Doctor only)
- Weekly appointment overview bar chart (completed vs cancelled)
- Recent visit records feed (Doctor only)
- Quick action buttons: New Patient · New Appointment · New Invoice
- Overdue invoice alert list

---

### 👤 Patient Management
- Full patient registry with rich profile data: personal info, medical history, emergency contacts, insurance
- Blood type, allergies, and chronic condition tracking
- Allergy alert banner — permanently visible on all clinical screens for flagged patients
- Card view and table view toggle with smooth transitions
- Advanced filtering: gender, blood type, age range, insurance status, activity status
- Debounced search by name, phone, or national ID
- Per-patient tabbed profile:
  - **Overview** — personal and medical info
  - **Visits** — clinical history (Doctor only)
  - **Appointments** — full appointment history
  - **Prescriptions** — all prescriptions with PDF print (Doctor only)
  - **Billing** — invoices, total paid, outstanding balance
  - **Documents** — uploaded lab results, imaging, and referrals
- Soft delete — patient records are never permanently removed

---

### 📅 Appointment Management
- Calendar view: Month / Week / Day with color-coded appointment cards
- List view: sortable, filterable table with inline status updates
- 8 appointment statuses: Scheduled · Confirmed · Checked-In · In-Progress · Completed · Cancelled · No-Show
- Real-time slot availability checking — blocks conflicting bookings automatically
- Patient search autocomplete in booking form with "Create New Patient" inline option
- Duration selector: 15 / 30 / 45 / 60 minute slots
- Today's schedule sidebar strip with progress tracker
- Appointment detail drawer with full action buttons per status
- Auto-send confirmation email to patient on booking
- Appointment reminder emails (1 hour and 24 hours before, configurable)

---

### 🩺 Visits & Treatment Records *(Doctor only)*
- Structured visit records linked to appointments
- Per-visit sections: Symptoms · Clinical Notes · Diagnosis · Prescriptions · Lab Requests · Next Visit
- ICD-10 code search with debounced lookup (bundled local database — no external API required)
- Inline prescription builder: medication name, dosage, frequency, duration, instructions
- Lab and imaging request checklist (CBC, BMP, X-Ray, MRI, CT Scan, and more)
- Print prescription as formatted PDF: clinic letterhead, patient info, medication table, doctor signature
- Auto-save clinical notes on blur
- Allergy alert banner always visible during visit

---

### 🧾 Billing & Invoicing
- Full invoice lifecycle: create, edit, send, mark paid, download PDF
- Auto-populate service prices from clinic default fee schedule
- Invoice line items: service type, description, quantity, unit price
- Auto-computed totals: subtotal, discount, tax, total, balance due
- Payment methods: Cash · Card · Insurance · Bank Transfer
- Invoice statuses: Paid (green) · Pending (amber) · Partial (blue) · Overdue (red)
- PDF invoice generation: clinic logo, patient info, services table, totals, PAID stamp overlay
- Email invoice directly to patient
- Overdue invoice notifications in the bell icon
- Stat cards: Total Revenue · Collected · Pending · Overdue

---

### 💸 Expense Tracking *(Doctor only)*
- Log clinic expenses by category: Salaries · Rent · Supplies · Equipment · Utilities · Marketing · Other
- Monthly and annual expense totals with category breakdown
- Export expenses to CSV
- Used in Reports for net income calculation

---

### 📊 Reports & Analytics *(Doctor only)*
- Period selector: This Month · Last 3 Months · This Year · Custom Range
- Financial overview: Total Revenue · Collected · Pending · Total Expenses · Net Income (with period-over-period % change)
- Revenue vs expenses area+line composed chart (12-month view)
- Appointments summary: grouped bar chart (completed / cancelled / no-show per month) + completion rate KPI
- Revenue by service type donut chart (animated on mount)
- Patient demographics:
  - Gender distribution donut
  - Age group horizontal bar chart (0–12 / 13–25 / 26–40 / 41–60 / 60+)
  - Blood type distribution
  - Insurance vs self-pay ratio
- Top 5 diagnoses horizontal bar chart (ICD-10 codes)
- Busiest time slot heatmap (Days × Hours, green intensity scale)
- New patients per month area chart
- Export full report to PDF or Excel

---

### ⚙️ Settings *(Doctor only)*
- Clinic profile: name, logo, address, phone, email, website
- Default service fee schedule (editable prices used across invoices)
- Doctor schedule: weekly grid with morning and afternoon time slots, slot duration, max daily appointments
- Doctor signature upload for prescription PDFs
- SMTP email configuration with test email button
- Appointment reminder timing configuration
- Staff management: add, edit, and deactivate receptionist accounts
- Security: change password

---

### 🩺 Doctor Profile
- Edit photo, name, specialty, qualification, registration number
- Manage weekly schedule and slot duration
- Update consultation and follow-up fees
- Upload digital signature for prescriptions
- Performance stats: total patients seen, monthly appointments, average daily count

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy (async) |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Authentication | JWT — access + refresh tokens, bcrypt |
| PDF Generation | ReportLab / WeasyPrint |
| Email | aiosmtplib (async SMTP) |
| ICD-10 Search | Bundled JSON — no external API |
| API Docs | Swagger UI + ReDoc (auto-generated) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript 5 |
| Routing | React Router v6 |
| Global State | Zustand |
| Server State | TanStack Query v5 |
| HTTP Client | Axios with interceptors |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Toasts | React Hot Toast |
| Dates | date-fns |
| PDF Preview | jsPDF + html2canvas |

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                          FRONTEND                            │
│           React 18 + TypeScript + Tailwind CSS               │
│        (Vite Dev Server  →  Nginx in production)             │
└───────────────────────────┬──────────────────────────────────┘
                            │  HTTPS / REST API
                            │  Authorization: Bearer {token}
┌───────────────────────────▼──────────────────────────────────┐
│                          BACKEND                             │
│               FastAPI  (Uvicorn ASGI Server)                 │
│                                                              │
│   ┌───────────┐    ┌───────────┐    ┌──────────────┐        │
│   │  Routers  │ →  │ Services  │ →  │ Repositories │        │
│   └───────────┘    └───────────┘    └──────┬───────┘        │
│                                            │                 │
│                               ┌────────────▼────────────┐   │
│                               │  SQLAlchemy ORM (async)  │   │
│                               └────────────┬────────────┘   │
└────────────────────────────────────────────┼────────────────┘
                                             │
                            ┌────────────────▼────────────────┐
                            │         PostgreSQL 16            │
                            │  (Patients · Visits · Invoices   │
                            │   Appointments · Expenses · ...)  │
                            └─────────────────────────────────┘
```

---

## ✅ Prerequisites

Ensure the following are installed before proceeding:

- **Python** `3.11+`
- **Node.js** `18+` and **npm** `9+`
- **PostgreSQL** `15+` (running locally or via Docker)
- **Git**

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/clinica-software.git
cd clinica-software
```

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# On macOS / Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values — see [Environment Variables](#-environment-variables) below.

#### Create the Database

```bash
# Connect to PostgreSQL and create the database
psql -U postgres -c "CREATE DATABASE clinica;"
```

#### Run Migrations

```bash
alembic upgrade head
```

#### Seed Initial Data

```bash
python seed.py
```

> This creates the default **Doctor** account, a sample **Receptionist** account, clinic settings, default service fees, and sample patient records.  
> All credentials are printed to the terminal on completion.

---

### 3. Frontend Setup

```bash
# Navigate to the frontend directory (from project root)
cd frontend

# Install all dependencies
npm install
```

#### Configure Environment Variables

```bash
cp .env.example .env
```

Set `VITE_API_BASE_URL` to your running backend URL (default: `http://localhost:8000`).

---

## ▶️ Running the Application

### Backend — Development Server

```bash
cd backend

# Activate virtual environment
source venv/bin/activate       # macOS / Linux
# venv\Scripts\activate        # Windows

# Start with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **`http://localhost:8000`**

---

### Frontend — Development Server

```bash
cd frontend

npm run dev
```

Frontend runs at: **`http://localhost:5173`**

---

### Running Both Simultaneously (from project root)

If a root-level `package.json` is configured with `concurrently`:

```bash
npm run dev
```

---

### Production Build

```bash
# Backend — production server with Gunicorn
cd backend
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000

# Frontend — build static files
cd frontend
npm run build
# Serve the generated /dist folder via Nginx or any static host
```

---

## 📖 API Documentation

Clinica Software provides fully auto-generated, interactive API documentation powered by **Swagger UI** and **ReDoc**.

Once the backend server is running, navigate to:

| Interface | URL |
|---|---|
| **Swagger UI** — interactive endpoint testing | `http://localhost:8000/docs` |
| **ReDoc** — clean readable reference | `http://localhost:8000/redoc` |
| **OpenAPI JSON Schema** | `http://localhost:8000/openapi.json` |

> **Authenticating in Swagger UI**  
> Click the **Authorize 🔒** button at the top right of the Swagger page.  
> Enter your token in the format: `Bearer <your_access_token>`  
> All protected endpoints become fully testable directly in the browser.

---

## 🔐 Roles & Permissions

| Module | Doctor (Owner) | Receptionist |
|---|:---:|:---:|
| Dashboard — full stats incl. revenue | ✅ | ✅ Revenue hidden |
| Patient Management — full CRUD | ✅ | ✅ |
| Appointments — full management | ✅ | ✅ |
| Visits — create, read, edit records | ✅ | ❌ List date only |
| Prescriptions — create, print PDF | ✅ | ❌ |
| ICD-10 Diagnosis Search | ✅ | ❌ |
| Billing — create + view invoices | ✅ | ✅ |
| Billing — update service prices | ✅ | ❌ |
| Mark Invoices as Paid | ✅ | ✅ |
| Expenses — full management | ✅ | ❌ |
| Reports — all analytics | ✅ | ❌ |
| Doctor Profile — edit | ✅ | ❌ (view only) |
| Settings — clinic config | ✅ | ❌ |
| Staff Management | ✅ | ❌ |
| Notification Log | ✅ | ✅ Own only |

---

## 🔧 Environment Variables

### Backend — `backend/.env`

```env
# Application
APP_NAME=Clinica Software
SECRET_KEY=your_super_secret_key_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/clinica

# SMTP — Email Notifications & Reminders
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_clinic_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@clinica.com

# CORS
FRONTEND_ORIGIN=http://localhost:5173

# Clinic Defaults
DEFAULT_CURRENCY=USD
DEFAULT_TAX_RATE=0.10
DEFAULT_SLOT_DURATION_MINUTES=30
```

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Clinica Software
```

---

## 📁 Project Structure

```
clinica-software/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # App entry point, CORS, middleware
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic BaseSettings from .env
│   │   │   ├── security.py             # JWT encode/decode, bcrypt hashing
│   │   │   ├── dependencies.py         # get_db(), get_current_user(),
│   │   │   │                           # require_role()
│   │   │   └── exceptions.py           # Global HTTP exception handlers
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── patient.py
│   │   │   ├── doctor.py
│   │   │   ├── appointment.py
│   │   │   ├── visit.py
│   │   │   ├── prescription.py
│   │   │   ├── invoice.py
│   │   │   ├── invoice_item.py
│   │   │   ├── expense.py
│   │   │   ├── document.py
│   │   │   └── notification.py
│   │   ├── schemas/                    # Pydantic v2 request/response schemas
│   │   ├── routers/                    # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── doctor.py
│   │   │   ├── appointments.py
│   │   │   ├── visits.py
│   │   │   ├── prescriptions.py
│   │   │   ├── invoices.py
│   │   │   ├── expenses.py
│   │   │   ├── reports.py
│   │   │   ├── dashboard.py
│   │   │   ├── notifications.py
│   │   │   ├── icd.py
│   │   │   └── settings.py
│   │   ├── services/                   # Business logic layer
│   │   ├── repositories/               # Database query layer
│   │   └── utils/
│   │       ├── email.py                # Async SMTP sender
│   │       ├── pdf.py                  # Prescription + invoice PDF
│   │       └── icd10.json              # Bundled ICD-10 code database
│   ├── alembic/                        # Database migrations
│   │   └── versions/
│   ├── seed.py                         # Initial data seeder
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                        # Axios instance + per-module API calls
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── TopBar.tsx
│   │   │   ├── ui/                     # Buttons, badges, drawers, modals,
│   │   │   │                           # skeletons, empty states
│   │   │   └── charts/                 # Recharts wrapper components
│   │   ├── pages/
│   │   │   ├── auth/                   # Login page
│   │   │   ├── dashboard/
│   │   │   ├── patients/               # List + profile + forms
│   │   │   ├── appointments/           # Calendar + list + drawer
│   │   │   ├── visits/                 # Visit detail + prescription builder
│   │   │   ├── billing/                # Invoice list + detail + PDF
│   │   │   ├── reports/                # Analytics + charts [doctor only]
│   │   │   ├── doctor/                 # Profile + schedule + fees
│   │   │   ├── settings/               # Clinic config [doctor only]
│   │   │   └── support/
│   │   ├── store/                      # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── themeStore.ts
│   │   │   └── notificationStore.ts
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── types/                      # TypeScript interfaces + enums
│   │   └── utils/                      # Formatters, date helpers, constants
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md
```

---

## 🤝 Contributing

Contributions, issues, and feature suggestions are welcome.

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)

```bash
git commit -m "feat: add ICD-10 autocomplete to visit form"
```

4. Push to your branch

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request with a clear title and description of your changes

---

<div align="center">

<br />

Engineered for medical professionals who expect the best.

```
  ┌──────────────────────────────────────┐
  │   🩺  CLINICA SOFTWARE               │
  │   Medicine meets modern management.  │
  └──────────────────────────────────────┘
```

</div>
