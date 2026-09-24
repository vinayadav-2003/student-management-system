# Project Knowledge

This file gives Freebuff context about your project: goals, commands, conventions, and gotchas.

## Project Overview
**Student Management System (SMS)** — Full-stack web app for student registration, multi-level approval workflows (Teacher → Headmaster), master data management, Excel bulk import, and printable QR-code-enabled ID card generation.

## Quickstart
- **Install frontend deps:** `npm install`
- **Start frontend dev server:** `npm run dev` (Vite on port 5173)
- **Install backend deps:** `cd server && npm install`
- **Start backend server:** `cd server && npm run dev` (nodemon, Express on port 5000)
- **Build frontend:** `npm run build`
- **Preview build:** `npm run preview`
- **Lint:** `npm run lint`

## Architecture
- **Frontend** (`src/`): React 19, React Router DOM v7, Vite 8, Bootstrap 5, SweetAlert2, Axios
- **Backend** (`server/`): Node.js, Express 5, JWT (`jsonwebtoken`), Multer, Nodemailer, `xlsx` (SheetJS)
- **Database**: Microsoft SQL Server (MSSQL) via `mssql` + `msnodesqlv8`
- **Auth**: JWT stored in localStorage, with OTP via email (Nodemailer) and CAPTCHA via `react-simple-captcha`
- **API Proxy**: Vite proxies `/api`, `/login`, `/verify-otp` → `http://localhost:5000` (configured in `vite.config.js`)

## Conventions
- **File naming**: Components in `src/components/`, pages in `src/pages/`, backend routes in `server/routes/`
- **API routes**: Express route files in `server/routes/` — `auth.js`, `users.js`, `students.js`, `masters.js`
- **Protected routes**: `ProtectedRoute.jsx` wraps pages; role-based access (HEADMASTER, TEACHER)
- **SweetAlert2**: Used for all confirmations and notifications (never native `alert()`/`confirm()`)
- **CSS**: Mix of Bootstrap classes and custom CSS files per page
- **DB init**: `server/dbInit.js` auto-creates tables on server start; tables include `Users`, `Students`, `States`, `Cities`, `Courses`, `matrix`, `student_desired`, `student_flow`

## Gotchas
- **MSSQL required**: The app requires a running Microsoft SQL Server instance with Windows authentication (msnodesqlv8) configured in `server/db.js`
- **Proxy in dev**: The Vite proxy only works in dev mode. In production, configure a reverse proxy or CORS.
- **OTP storage**: OTP codes are stored in `server/otp.txt` on the filesystem (not in DB)
- **Photo storage**: Student photos are stored as Base64 strings directly in the DB, not as files
- **No TypeScript**: The project is plain JavaScript/JSX (no TS), despite some `@types/*` dev dependencies
- **No test suite**: There are no test files or test runner configured
