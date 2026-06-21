# Clinic Management API

Production-ready REST API for a **Private Medical Clinic Management System**, built with FastAPI, async SQLAlchemy, PostgreSQL, Alembic, and Pydantic v2.

## Features

- **JWT auth** with access (30 min) + refresh (7 day) tokens, bcrypt hashing, refresh-token blacklist on logout.
- **RBAC**: `doctor` (full access) and `receptionist` (front-desk access; blocked from clinical, financial reports, expenses, settings).
- **Clean layered architecture**: `routers/ -> services/ -> repositories/ -> models/`, with `schemas/` for Pydantic v2 I/O.
- **Domains**: Auth, Patients, Doctor, Appointments, Visits & Prescriptions, Billing & Invoices, Expenses, Reports & Analytics, Dashboard, Notifications, Settings, ICD-10 search.
- **PDF generation** (ReportLab): prescription sheet + invoice with PAID stamp.
- **Async email** (aiosmtplib) for appointment confirmations and invoice delivery via background tasks.
- **Soft delete** everywhere; `Decimal(10,2)` money; standard response envelope.
- **Swagger UI** at `/docs` (BearerAuth), **ReDoc** at `/redoc`.

## Project structure

```
app/
  main.py             # App init, CORS, router registration
  core/               # config, security, dependencies, exceptions
  database.py         # async engine + Base + mixins
  models/             # SQLAlchemy ORM models
  schemas/            # Pydantic v2 schemas
  repositories/       # DB queries per domain
  services/           # Business logic per domain
  routers/            # FastAPI APIRouter per domain
  utils/              # email, pdf, csv/excel, icd, response, pagination
  data/icd10.json     # bundled ICD-10 codes
alembic/              # async migration environment
seed.py               # initial data seeder
start_backend.sh      # one-command startup script
requirements.txt
.env                  # environment configuration
```

## Setup

### 1. Requirements

- Python 3.11+
- PostgreSQL 16

### 2. Configure Database

Ensure PostgreSQL is running with a database `clinic_db` and user `clinic`/`clinic`. If not set up yet:
```bash
sudo -u postgres psql -c "CREATE USER clinic WITH PASSWORD 'clinic';"
sudo -u postgres psql -c "CREATE DATABASE clinic_db OWNER clinic;"
```

### 3. Quick Start (Recommended)

Use the provided startup script to automate environment creation, dependency installation, database seeding, and running the server:

```bash
bash start_backend.sh
```

### 4. Manual Setup (Alternative)

If you prefer to run things manually:

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed initial data (creates tables directly and adds demo data)
python seed.py
```

This creates tables directly and prints the demo logins:

- Doctor: `doctor` / `Doctor@123`
- Receptionist: `reception` / `Reception@123`

```bash
# 4. Run the server
uvicorn app.main:app --reload --port 8000
```

Open:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Authentication flow

1. `POST /auth/login` with `{ "username": "doctor", "password": "Doctor@123" }`.
2. Copy `access_token` from the response.
3. In Swagger, click **Authorize** and paste the token.
4. Refresh via `POST /auth/refresh`; log out (revoke refresh token) via `POST /auth/logout`.

## Response envelope

```json
{
  "success": true,
  "data": {},
  "message": "OK",
  "pagination": { "page": 1, "limit": 20, "total": 0, "total_pages": 0 }
}
```

## RBAC summary

| Area | Doctor | Receptionist |
|------|--------|--------------|
| Patients CRUD | ✅ | ✅ |
| Appointments CRUD + status | ✅ | ✅ |
| Invoices create/view/pay/pdf/send | ✅ | ✅ |
| Visit list (no clinical fields) | ✅ | ✅ |
| Visit clinical content + prescriptions | ✅ | ❌ |
| Reports & analytics | ✅ | ❌ |
| Expenses | ✅ | ❌ |
| Settings + staff | ✅ | ❌ |
| Doctor profile/fees edit | ✅ | ❌ |

## Notes on background jobs

Confirmation and invoice emails are dispatched via FastAPI `BackgroundTasks`. Daily reminder crons (08:00 for next-day appointments) and 1-hour-before reminders are intended to be wired to an external scheduler (e.g. cron / APScheduler / Celery beat) that calls the notification service; the email + logging helper (`send_and_log_email`) is provided.
