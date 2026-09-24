# Student Management System — Individual File Documentation

This directory contains **file-wise technical documentation** for every source file in the project. Each document covers purpose, dependencies, state, key functions, data flow, and design notes for its corresponding file.

---

## 📁 Structure

```
docs/
├── README.md                          ← This file
├── pages/                             ← Frontend page components (14)
│   ├── LOGIN.md
│   ├── OTP.md
│   ├── CHANGE_PASSWORD.md
│   ├── STUDENT_LIST.md
│   ├── CREATE_STUDENT.md
│   ├── UPDATE_STUDENT.md
│   ├── STUDENT_DETAILS.md
│   ├── PRINT_STUDENT_ID.md
│   ├── IMPORT_STUDENT.md
│   ├── IMPORT_PREVIEW.md
│   ├── STATE_MASTER.md
│   ├── CITY_MASTER.md
│   ├── COURSE_MASTER.md
│   └── USER_MASTER.md
│
├── components/                        ← Reusable UI components (3)
│   ├── DASHBOARD.md
│   ├── CAMERA_MODAL.md
│   └── PIE_CHART.md
│
├── core/                              ← Frontend core files (3)
│   ├── APP.md
│   ├── PROTECTED_ROUTE.md
│   └── API_LAYER.md
│
├── routes/                            ← Backend API route files (4)
│   ├── AUTH_ROUTES.md
│   ├── USERS_ROUTES.md
│   ├── STUDENTS_ROUTES.md
│   └── MASTERS_ROUTES.md
│
└── server/                            ← Backend core files (5)
    ├── SERVER.md
    ├── DATABASE.md
    ├── DB_INIT.md
    ├── AUTH_MIDDLEWARE.md
    └── MAIL_SERVICE.md
```

---

## 📄 Document Count

| Category | Count |
|----------|-------|
| Frontend Pages | 14 |
| UI Components | 3 |
| Frontend Core | 3 |
| API Routes | 4 |
| Server Core | 5 |
| **Total** | **29** |

---

## 🔗 Quick Links

### Authentication Flow
- [LOGIN.md](pages/LOGIN.md) — Login form with CAPTCHA and Forgot Password toggle
- [OTP.md](pages/OTP.md) — OTP verification page
- [CHANGE_PASSWORD.md](pages/CHANGE_PASSWORD.md) — Password change (voluntary & forced)
- [PROTECTED_ROUTE.md](core/PROTECTED_ROUTE.md) — Route guard and JWT validation
- [AUTH_ROUTES.md](routes/AUTH_ROUTES.md) — Backend auth endpoints
- [AUTH_MIDDLEWARE.md](server/AUTH_MIDDLEWARE.md) — JWT verification middleware

### Student Management
- [STUDENT_LIST.md](pages/STUDENT_LIST.md) — Paginated table with filters & pie charts
- [CREATE_STUDENT.md](pages/CREATE_STUDENT.md) — Student registration form
- [UPDATE_STUDENT.md](pages/UPDATE_STUDENT.md) — Student edit form
- [STUDENT_DETAILS.md](pages/STUDENT_DETAILS.md) — Full profile + approval workflow
- [PRINT_STUDENT_ID.md](pages/PRINT_STUDENT_ID.md) — Printable ID card with QR code
- [STUDENTS_ROUTES.md](routes/STUDENTS_ROUTES.md) — Backend student CRUD + approval + Excel

### Excel Import
- [IMPORT_STUDENT.md](pages/IMPORT_STUDENT.md) — File upload page
- [IMPORT_PREVIEW.md](pages/IMPORT_PREVIEW.md) — Preview & validate before import

### Master Data Management
- [STATE_MASTER.md](pages/STATE_MASTER.md) — State CRUD
- [CITY_MASTER.md](pages/CITY_MASTER.md) — City CRUD
- [COURSE_MASTER.md](pages/COURSE_MASTER.md) — Course CRUD
- [USER_MASTER.md](pages/USER_MASTER.md) — User management with RBAC
- [MASTERS_ROUTES.md](routes/MASTERS_ROUTES.md) — Backend master data CRUD

### App Infrastructure
- [APP.md](core/APP.md) — Root App with routing and navigation
- [API_LAYER.md](core/API_LAYER.md) — Axios client and endpoint functions
- [DASHBOARD.md](components/DASHBOARD.md) — Dashboard with stats and search
- [CAMERA_MODAL.md](components/CAMERA_MODAL.md) — Webcam capture modal
- [PIE_CHART.md](components/PIE_CHART.md) — CSS donut chart component

### Server Infrastructure
- [SERVER.md](server/SERVER.md) — Express server configuration
- [DATABASE.md](server/DATABASE.md) — MSSQL connection pool
- [DB_INIT.md](server/DB_INIT.md) — Schema and seed data
- [MAIL_SERVICE.md](server/MAIL_SERVICE.md) — Nodemailer email notifications
