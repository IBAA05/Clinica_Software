# Clinica — Clinic Management Frontend

A luxury-grade Private Medical Clinic Management System frontend built with React 18, Vite, TypeScript, and a Luxury Medical Green design system.

## Tech Stack

- **React 18 + Vite** + **TypeScript 5**
- **React Router v6** — protected routes + role-based guards
- **Zustand** — auth, theme, and notification stores
- **TanStack Query v5** — data fetching, caching, background refetch
- **Axios** — interceptors attach the JWT and auto-refresh on 401
- **Tailwind CSS v3** — custom green design tokens, dark mode
- **Framer Motion** — page transitions, card mounts, drawer slides, count-up
- **Recharts** — area / bar / line / donut / composed charts
- **React Hook Form + Zod** — all forms with inline validation
- **React Hot Toast** — success/error/info toasts (top-right)
- **date-fns** — date formatting (`dd MMM yyyy`) and age calculation
- **jsPDF + html2canvas** — prescription & invoice PDFs
- **Lucide React** — icons
- **@tanstack/react-table** — sortable / paginated tables

## Getting Started

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev            # start dev server
npm run build          # production build
npm run preview        # preview the build
```

### Environment

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL of the clinic API | `http://localhost:8000/api/v1` |

## Demo Logins

| Role | Username | Password |
| --- | --- | --- |
| Doctor | `doctor` | `Doctor@123` |
| Receptionist | `reception` | `Reception@123` |

## Project Structure

```
src/
  api/          Axios endpoint wrappers (auth, patients, appointments, visits, invoices, misc)
  components/   UI primitives, layout, charts, guards, drawers, modals
  hooks/        useDebounce
  lib/          axios, queryClient, utils, colors, motion, pdf
  pages/        Login, Dashboard, Patients, PatientProfile, Appointments,
                Visits, VisitDetail, Billing, Reports, DoctorProfile, Settings, Support, NotFound
  stores/       authStore, themeStore, notificationStore
  types/        shared TypeScript types
```

## Roles

- **Doctor** — full access including Visits & Records, Reports, and Settings.
- **Receptionist** — Dashboard, Patients, Appointments, and Billing. Clinical and analytics routes redirect to the dashboard with a toast.

## Design System

Luxury Medical Green. Primary `#10B981`, teal accent `#0D9488`, near-white background `#F8FAFB`. Headings use *Plus Jakarta Sans*; body uses *Inter* with tabular numerals for stats and prices. Dark mode is toggleable from the top bar and persisted.
