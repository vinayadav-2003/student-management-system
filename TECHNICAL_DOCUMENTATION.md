# 📘 Technical Documentation - Student Management System (SMS)

Complete Technical Documentation for all project work pages, backend API routes, database schemas, and system architecture.

---

## 🎯 Executive Summary & Tech Stack

This **Student Management System (SMS)** is a full-stack web application built to streamline student registration, multi-level approval workflows (Teacher → Headmaster), master data management, Excel bulk import, and printable QR-code-enabled ID card generation.

### Technology Stack
* **Frontend**: React 19, React Router DOM v7, Vite 8, Bootstrap 5, SweetAlert2, `react-qr-code`, `react-simple-captcha`, Axios.
* **Backend**: Node.js, Express 5, JWT (`jsonwebtoken`), Multer (`multer`), Nodemailer (`nodemailer`), `xlsx` (SheetJS).
* **Database**: Microsoft SQL Server (MSSQL) using `mssql` and `msnodesqlv8` native drivers with Windows Authentication.

---

## 🏗️ System Architecture & Workflow Overview

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                        React Frontend (Vite :5173)               │
 │                                                                  │
 │  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐  │
 │  │ Login / OTP  │ →  │ Student List │ →  │ Student Details &  │  │
 │  │ & Captcha    │    │ + Dashboard  │    │ Approval Workflow  │  │
 │  └──────────────┘    └──────┬───────┘    └────────────────────┘  │
 │                             │                                    │
 │                    ┌────────┴────────┐                           │
 │                    ▼                 ▼                           │
 │            ┌──────────────┐   ┌──────────────┐                   │
 │            │ Master Pages │   │ ID Print &   │                   │
 │            │ (HM Only)    │   │ Excel Import │                   │
 │            └──────────────┘   └──────────────┘                   │
 └────────────────────────────────┬─────────────────────────────────┘
                                  │ Axios HTTP + JWT Auth Header
                                  │ Vite Proxy → localhost:5000
                                  ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                    Express Backend (Port 5000)                    │
 │                                                                  │
 │  /login → /verify-otp → /api/auth/* → /api/users/*              │
 │  /api/students/* → /api/masters/* → /api/forgot-password        │
 │  /api/change-password → /api/export/* → /api/dashboard/stats    │
 └────────────────────────────────┬─────────────────────────────────┘
                                  │ mssql Pool Query Execution
                                  ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                       MSSQL Database                             │
 │  Users | Students | States | Cities | Courses                    │
 │  matrix | student_desired | student_flow                         │
 └──────────────────────────────────────────────────────────────────┘
```

**Vite Dev Proxy** (`vite.config.js`): Proxies `/api`, `/login`, and `/verify-otp` to `http://localhost:5000` (Express backend) in dev mode.

---

## 🔐 Authentication & Security Flow

### Complete Auth Flow:
1. User navigates to `/login`
2. React Simple Captcha is loaded (`loadCaptchaEnginge(6)`)
3. User enters email + password → POST `/login` (NOT `/api/login`)
4. Backend validates credentials against `Users` table
5. **If valid**: Backend generates a 6-digit OTP, stores it in-memory `otpStore` (Map), emails it via Nodemailer
6. Frontend redirects to `/otp` with email in location state
7. User enters OTP → POST `/verify-otp` (NOT `/api/verify-otp`)
8. Backend validates OTP, generates JWT token, returns it
9. Frontend stores JWT in `localStorage`, redirects to `/read`

### Edge Cases:
- **Force Password Change**: If `Force_Password == 'Y'` in DB, the JWT includes `requiresPasswordChange: true`, and the user is redirected to `/change-password`
- **Temp Password Login**: If the user logged in via Forgot Password flow, the `isTempLogin` flag is set, JWT expires in 1h, and immediate password change is required
- **OTP Expiry**: OTPs expire after 5 minutes (stored in `otpStore` Map with `expiresAt`)

### Forgot Password Flow:
1. User clicks "Forgot Password?" on login page → toggles `forgotMode`
2. User enters email → POST `/api/forgot-password`
3. Backend checks if email exists in `Users` table
4. Generates random 8-character temporary password
5. Stores it in `TempPassword` column, sets `IsTempPassword = 1`
6. Emails the temporary password to the user with a styled HTML email
7. User logs in with the temporary password → `isTempLogin = true` → JWT with `requiresPasswordChange: true`
8. User is forced to change password immediately

---

## 📄 Project Work Pages Technical Analysis

### 1. 🔑 Login Page (`log_in.jsx` / Route: `/login`)
* **Purpose**: User authentication with CAPTCHA security and optional Forgot Password flow.
* **Key Features**:
  * **Email & Password Authentication**: POST `/login`
  * **CAPTCHA Security**: Uses `react-simple-captcha` (`LoadCanvasTemplateNoReload`, `validateCaptcha`)
  * **OTP-based Login**: After password validation, OTP is sent via email (not a direct switch)
  * **Force Password Change**: Automatically detected from JWT payload
  * **Forgot Password**: Toggle UI between login form and forgot password form; sends temporary password via email
  * **Show/Hide Password Toggle**: 👁️/🙈 button in password field
  * **Enter key support**: Pressing Enter triggers login

### 2. 📱 OTP Verification Page (`Otp.jsx` / Route: `/otp`)
* **Purpose**: Email OTP verification as the second factor after password validation.
* **Key Features**:
  * Receives email via `location.state.email` (protected — if no email in state, redirects to `/login`)
  * POST `/verify-otp` with `{ email, otp }`
  * On success: stores JWT in `localStorage`, checks `sessionStorage` for redirect URL, navigates accordingly
  * Simple 6-digit text input (no individual digit boxes — currently uses a single input with `maxLength={6}`)
  * **Note**: This page currently does NOT have a countdown timer or resend OTP functionality in the code

### 3. 🔐 Change Password Page (`ChangePassword.jsx` / Route: `/change-password`)
* **Purpose**: Password update with support for mandatory forced reset.
* **Key Features**:
  * Three fields: Current/Old Password, New Password, Confirm New Password
  * All fields have show/hide toggle
  * **Password strength rules**: Min 8 chars, requires uppercase + lowercase + number + special character
  * **New vs old check**: New password cannot match old/temporary password
  * **Forced mode**: If JWT has `requiresPasswordChange`, the UI shows "Change Password Required" and logs out the user after success
  * **API**: POST `/api/change-password` (authenticated)
  * **Email notification**: Sends a styled "Password Changed Successfully" email
  * **On success**: SweetAlert2 confirmation → if forced, clears token and redirects to `/`; otherwise navigates to `/read`

### 4. 📋 Student List & Dashboard (`StudentList.jsx` / Route: `/read` & `/`)
* **Purpose**: Central hub for student management with interactive analytics.
* **Key Features**:
  * **Interactive Pie Charts** (via `PieChart.jsx`): Three donut charts showing student distribution by State, City, and Course
    * Click a segment → filter the student table by that value
    * Click the center circle → reset that filter
    * Hover shows tooltip with count and percentage
    * Animated hover effects on cards
  * **Dashboard Stats Bar** (`dasboad.jsx` component): Shows real-time counts of Total Students, States, Cities, Courses
    * Includes a **Search Input** on the right side that updates the URL query param `?search=...`
    * "Clear" button appears when a search is active
    * Stats update via custom events (`studentCountChanged`, `stateChanged`, `cityChanged`, `courseChanged`)
  * **Multi-Filter System**:
    * Dropdowns for State, City (cascading — only shows cities for selected state), and Course
    * "Clear" button to reset all filters
    * Also filterable by click on Pie Chart segments
  * **Filter Tabs**: Three toggle buttons — "All Students", "Enterby me" (created by current user), "Pending details" (pending/forwarded/returned/null status)
  * **Table Columns** (Normal mode): S.No, Student ID, Name, Email, Course, State, City, Mobile, Age, Action
  * **Table Columns** (Pending mode): S.No, Student ID, Name, Course, Status, Action (simplified view)
  * **Action Buttons**:
    * 🖨️ Print ID — opens `/print-student/:id` in a new window
    * ✏️ Update — navigates to `/update/:id`
    * 🗑️ Delete — SweetAlert2 confirmation → delete via API → refresh list
  * **Bulk Actions**:
    * 📥 Import Excel → navigates to `/import`
    * 📤 Export Excel → downloads `students.xlsx` via `/api/export/students/excel`
  * **Pagination**: 10 items per page with Previous/Next buttons

### 5. ➕ Create Student Page (`CreateStudent.jsx` / Route: `/create`)
* **Purpose**: Registration form to add a new student (HEADMASTER/TEACHER only).
* **Key Features**:
  * Form fields: Name, Email, State (dropdown), City (cascading dropdown), Course, Mobile, Age
  * **Photo Upload**: "📷 Camera" button opens `CameraModal.jsx` for webcam capture
  * **Camera Modal**: Uses `navigator.mediaDevices.getUserMedia` → live preview → capture to canvas → return as `File` object
  * **Input Validations**: Name required, Email regex, State/City/Course required, Mobile must be 10 digits, Age 10-100
  * **Duplicate Check**: Backend checks for exact duplicate before inserting
  * **On Submit**: FormData with photo → POST `/api/students` (multipart)
  * **Email on Success**: Welcome email sent via `mailService.js`; if email fails, shows warning but student is still saved
  * **Approval Flow Init**: Automatically creates `student_desired` + `student_flow` entries for level 1 approver
  * **Access**: Protected by `allowedRoles={["HEADMASTER", "TEACHER"]}`

### 6. ✏️ Update Student Page (`updateStudent.jsx` / Route: `/update/:id`)
* **Purpose**: Edit existing student record (HEADMASTER/TEACHER only).
* **Key Features**:
  * Pre-populates form from GET `/api/students/:id` response
  * Cascading State/City dropdowns (initialized based on existing data)
  * Photo section: Shows existing photo with "Current Photo" label; new photo replaces it
  * **Camera Modal**: Same as Create page
  * **On Submit**: FormData with optional new photo → PUT `/api/students/:id`
  * **Access**: Protected by `allowedRoles={["HEADMASTER", "TEACHER"]}`

### 7. 🔍 Student Details & Approval Workflow Page (`StudentDesatis.jsx` / Route: `/student-details/:id`)
* **Purpose**: Deep view of student profile with multi-level approval workflow execution.
* **Key Features**:
  * **Profile View**: Read-only fields for Student ID, Name, Email, Mobile, Course, Age, State, City, Created By, Created Date, Status
  * **Status Display**: Color-coded — Returned (warning), Approved (success), Rejected (danger), Forwarded (info), Pending (default)
  * **Approval Decision Panel**:
    * Decision dropdown: Approve, Reject, Return, Forward
    * Remarks textarea (required)
    * Forward user dropdown (required when Forward is selected; populated from GET `/api/users`)
    * Confirm dialog via SweetAlert2 with context-aware colors
  * **Approval History**: Shows latest decision with reviewer name, expandable with ▲/▼ toggle
  * **URL parameter support**: `?action=approve` scrolls smoothly to the approval section
  * **Role-based**: `getRole()` extracts role from JWT; approval panel visible for TEACHER and HEADMASTER roles
  * **API**: POST `/api/students/:id/approval`
  * **Email notifications**: Approval decisions trigger email via `mailService.js`

### 8. 🪪 Student ID Card Generator (`PrintStudentId.jsx` / Route: `/print-student/:id`)
* **Purpose**: Generates a standardized, printable Student Identification Card.
* **Key Features**:
  * **QR Code**: Uses `react-qr-code` to encode student information
  * **Print-Optimized Styling**: `PrintStudentId.css` — `@media print` hides nav, sidebar, and other non-essential elements
  * **Auto-Print**: `window.print()` triggered on load
  * **Layout**: Photo, student name, ID, course, and QR code in a card format

### 9. 📊 Excel Bulk Import & Preview Pages (`ImportStudent.jsx` & `ImportPreview.jsx`)
* **Purpose**: Bulk upload of student records from Excel files.
* **Key Features**:
  * **ImportStudent.jsx**:
    * File input accepting `.xlsx`, `.xls`
    * "Download Excel Template" button → downloads `/sample.xlsx`
    * "Preview Data" button → sends file to backend via POST `/api/upload/students/excel/preview` (multipart)
    * Loading spinner during processing
  * **ImportPreview.jsx**:
    * Displays parsed spreadsheet data in an editable table (scrollable, max-height 450px)
    * Color-coded status: Ready (info), Duplicate (danger), Missing Email (warning)
    * Remove button per row
    * "Import Data" button → POST `/api/upload/students/excel/import` with only status="Ready" records
    * Back button to return to import page
  * **Backend Processing**: Matches state/city/course names against DB to normalize; checks email duplicates

### 10. ⚙️ Master Data Pages (HEADMASTER Only)
* 🗺️ **State Master** (`StateMaster.jsx` / `/states`):
  * Full CRUD: Add (form), Edit (inline), Delete (with SweetAlert2 confirmation)
  * Cascading delete warning: "All cities under this state will also be deleted!"
  * Custom events: `stateChanged` dispatched to refresh dashboard stats
  * API: `getStates`, `createState`, `updateState`, `deleteState`

* 🏙️ **City Master** (`CityMaster.jsx` / `/cities`):
  * State binding dropdown for adding/editing cities
  * Displays `stateName` alongside city name in the list table
  * Input disabled until state is selected
  * Custom events: `cityChanged` dispatched to refresh dashboard stats
  * API: `getCities`, `createCity`, `updateCity`, `deleteCity`

* 📘 **Course Master** (`CourseMaster.jsx` / `/courses`):
  * Simple CRUD for course list (BCA, MCA, B.Tech, etc.)
  * Custom events: `courseChanged` dispatched to refresh dashboard stats
  * API: `getCourses`, `createCourse`, `updateCourse`, `deleteCourse`

* 👥 **User Master** (`UserMaster.jsx` / `/users`):
  * Create/Edit users with Name, Role (Headmaster/Teacher/Student), Email, Phone
  * **Role-based restrictions**: Teachers can only create/edit/delete Students; Headmasters can manage all
  * **Self-deletion prevention**: Cannot delete your own account
  * **Password**: Auto-generated if not provided; welcome email sent with temporary password; `Force_Password` set to 'Y'
  * **Matrix sync**: When role changes, the `matrix` table is updated (Teacher = level 1, Headmaster = level 2)
  * Search bar for filtering the user list
  * API: `getUsers`, `createUser`, `updateUser`, `deleteUser`

---

## 🧩 Key Components

### CameraModal (`src/components/CameraModal.jsx`)
* **Purpose**: Webcam capture for student photos
* **Features**: 
  * Requests camera access via `navigator.mediaDevices.getUserMedia`
  * Live video preview with viewfinder overlay
  * Capture button → draws video frame to canvas → returns as `File` (JPEG)
  * Retake and Use Photo buttons after capture
  * Error handling with retry button if camera access fails
  * Cleanup: stops all tracks on close/unmount

### Dashboard (`src/components/dasboad.jsx`)
* **Purpose**: Stats summary bar and search input
* **Features**:
  * Fetches stats via `getDashboardStats()` API
  * Four stat cards: Students, States, Cities, Courses
  * Search input updates URL query param for filtering the student list
  * Listens to custom events (`studentCountChanged`, `stateChanged`, `cityChanged`, `courseChanged`) for live updates

### PieChart (`src/components/PieChart.jsx`)
* **Purpose**: Interactive donut chart for data visualization
* **Features**:
  * Pure CSS conic-gradient donut (no external charting library)
  * Hover tooltip with label, count, and percentage
  * Click-on-segment filter (via `onSelect` callback)
  * Click-on-center reset filter (via `onReset` callback)
  * Animated card hover (translateY, box-shadow)
  * Legend with color-coded items and percentages
  * Scrollable legend with truncation for long labels
  * Empty state display: "No data available"

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Page / Feature | HEADMASTER | TEACHER | STUDENT / PUBLIC |
| :--- | :---: | :---: | :---: |
| Login / OTP / Captcha / Forgot Password | ✅ | ✅ | ✅ |
| Student List (`/read`) | ✅ | ✅ | ✅ (Read-only) |
| Student Details (`/student-details/:id`) | ✅ | ✅ | ✅ |
| Create Student (`/create`) | ✅ | ✅ | ❌ |
| Update Student (`/update/:id`) | ✅ | ✅ | ❌ |
| Import Excel (`/import`) | ✅ | ✅ | ❌ |
| Print ID Card (`/print-student/:id`) | ✅ | ✅ | ✅ |
| Master Data (States, Cities, Courses) | ✅ | ❌ | ❌ |
| User Master Management (`/users`) | ✅ | ❌ | ❌ |
| Level 1 Approval Decision | ✅ | ✅ | ❌ |
| Level 2 Final Approval Decision | ✅ | ❌ | ❌ |

**User Master Role Constraints**:
- HEADMASTER: Can create/edit/delete all roles (Headmaster, Teacher, Student)
- TEACHER: Can only create/edit/delete users with role = Student
- Self-deletion: Not allowed

---

## 🌐 API Endpoint Reference

### Authentication Routes (`server/routes/auth.js`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | No | Validate email/password, send OTP email |
| POST | `/verify-otp` | No | Verify OTP, return JWT token |
| POST | `/api/forgot-password` | No | Send temporary password to email |
| POST | `/api/change-password` | JWT | Change user password (supports temp password) |

### Student Routes (`server/routes/students.js`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students` | JWT | List students with pagination, search, and filters |
| GET | `/api/students/:id` | JWT | Get single student with approval status |
| POST | `/api/students` | JWT | Create student (multipart with photo) |
| PUT | `/api/students/:id` | JWT | Update student (through API `api.jsx`, route defined elsewhere) |
| DELETE | `/api/students/:id` | JWT | Delete student (through API `api.jsx`, route defined elsewhere) |
| POST | `/api/students/:id/approval` | JWT | Submit approval decision (Approve/Reject/Return/Forward) |
| GET | `/api/students/aggregates` | JWT | Get student counts grouped by state/city/course |
| GET | `/api/students/check-email` | No | Check if email already exists |
| GET | `/api/studentsCount` | No | Get total student count |
| GET | `/api/dashboard/stats` | No | Get dashboard stats (students, states, cities, courses counts) |
| GET | `/api/export/students/excel` | JWT | Export all students as Excel (.xlsx) |
| POST | `/api/upload/students/excel/preview` | JWT | Upload Excel file and preview parsed data (multipart) |
| POST | `/api/upload/students/excel/import` | JWT | Bulk import students from parsed Excel data |

### User Routes (`server/routes/users.js`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | JWT | List all users |
| POST | `/api/users` | JWT | Create user (auto-generates password, sends welcome email) |
| PUT | `/api/users/:id` | JWT | Update user (syncs matrix table on role change) |
| DELETE | `/api/users/:id` | JWT | Delete user (prevents self-deletion) |

### Master Data Routes (`server/routes/masters.js`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/states` | JWT | List all states |
| POST | `/api/states` | JWT | Create state |
| PUT | `/api/states/:id` | JWT | Update state |
| DELETE | `/api/states/:id` | JWT | Delete state (cascades to cities) |
| GET | `/api/cities` | JWT | List all cities (optional `stateId` query param for filtering) |
| POST | `/api/cities` | JWT | Create city |
| PUT | `/api/cities/:id` | JWT | Update city |
| DELETE | `/api/cities/:id` | JWT | Delete city |
| GET | `/api/courses` | JWT | List all courses |
| POST | `/api/courses` | JWT | Create course |
| PUT | `/api/courses/:id` | JWT | Update course |
| DELETE | `/api/courses/:id` | JWT | Delete course |

---

## 🗄️ Database Schema Reference (MSSQL)

### 1. Users Table
```sql
CREATE TABLE Users (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(100) NOT NULL,
  Role NVARCHAR(50) NOT NULL,           -- 'Headmaster', 'Teacher', 'Student'
  Email NVARCHAR(100) UNIQUE NOT NULL,
  Phone NVARCHAR(20) NULL,
  Password NVARCHAR(100) NOT NULL,
  Force_Password NVARCHAR(5) DEFAULT 'N' NOT NULL,  -- 'Y' forces password change on next login
  CreatedBy INT NULL,
  CreatedDate DATETIME DEFAULT GETUTCDATE() NOT NULL,
  UpdatedBy INT NULL,
  UpdatedDate DATETIME NULL,
  TempPassword NVARCHAR(100) NULL,       -- Temporary password for forgot password flow
  IsTempPassword BIT DEFAULT 0 NOT NULL   -- 1 = user must use TempPassword to login
);
```

### 2. Students Table
```sql
CREATE TABLE Students (
  id INT IDENTITY(1,1) PRIMARY KEY,
  student_id NVARCHAR(50) NULL,          -- Auto-generated: STU001, STU002, etc.
  name NVARCHAR(100) NULL,
  email NVARCHAR(100) NULL,
  course NVARCHAR(100) NULL,
  state NVARCHAR(100) NULL,
  city NVARCHAR(100) NULL,
  age INT NULL,
  mobile NVARCHAR(15) NULL,
  photo NVARCHAR(MAX) NULL,              -- Base64 encoded image
  location NVARCHAR(MAX) NULL,           -- Geolocation / Address string
  createdBy INT NULL,
  createdDate DATETIME DEFAULT GETUTCDATE() NOT NULL,
  updatedBy INT NULL,                    -- ID of user who last updated
  updatedDate DATETIME NULL              -- Timestamp of last update
);
```

### 3. States Table
```sql
CREATE TABLE States (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) UNIQUE NOT NULL
);
```

### 4. Cities Table
```sql
CREATE TABLE Cities (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  stateId INT FOREIGN KEY REFERENCES States(id) ON DELETE CASCADE,
  CONSTRAINT UC_City_State UNIQUE (name, stateId)
);
```

### 5. Courses Table
```sql
CREATE TABLE Courses (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) UNIQUE NOT NULL
);
```

### 6. Approval Matrix Table
```sql
CREATE TABLE matrix (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
  level INT NOT NULL    -- 1 = Teacher, 2 = Headmaster
);
```

### 7. Student Desired Table (Links students to their intended approver)
```sql
CREATE TABLE student_desired (
  id INT IDENTITY(1,1) PRIMARY KEY,
  student_id INT FOREIGN KEY REFERENCES Students(id) ON DELETE CASCADE,
  level INT DEFAULT 1 NOT NULL,
  user_id INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT GETUTCDATE() NOT NULL
);
```

### 8. Student Flow Table (Approval workflow audit trail)
```sql
CREATE TABLE student_flow (
  id INT IDENTITY(1,1) PRIMARY KEY,
  student_id INT FOREIGN KEY REFERENCES Students(id) ON DELETE CASCADE,
  student_desired_id INT FOREIGN KEY REFERENCES student_desired(id) ON DELETE NO ACTION,
  user_id INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
  level INT NOT NULL,
  decision NVARCHAR(50) NULL,           -- 'Approved', 'Rejected', 'Returned', 'Forward', 'Forwarded'
  remarks NVARCHAR(MAX) NULL,
  decision_datetime DATETIME DEFAULT GETUTCDATE() NOT NULL,
  status CHAR(1) DEFAULT 'N' NOT NULL,  -- 'Y' = closed/completed, 'N' = pending/active
  updated_by INT NULL FOREIGN KEY REFERENCES Users(Id),
  updated_at DATETIME NULL,
  CONSTRAINT CK_student_flow_decision CHECK (decision IS NULL OR decision IN ('Approved', 'Rejected', 'Returned', 'Forward', 'Forwarded')),
  CONSTRAINT CK_student_flow_status CHECK (status IN ('Y', 'N'))
);
```

---

## 📧 Email System

The application uses Nodemailer with Gmail SMTP. Two types of emails are sent:

### 1. Welcome Email (New Student Registration)
* **Trigger**: New student created via POST `/api/students`
* **Content**: Student name, ID, course details
* **Config**: `sendEmail({ type: "WELCOME", to: student.email, student })` via `mailService.js`

### 2. Pending Approval Notification
* **Trigger**: Student created and assigned to an approver
* **Content**: Notification to approver that a student is pending their review
* **Config**: `sendEmail({ type: "PENDING_APPROVAL", to: approver.Email, student, user, level })` via `mailService.js`

### 3. OTP Email
* **Trigger**: Successful login with email/password
* **Content**: 6-digit OTP with styled HTML template
* **Sender**: `transporter.sendMail()` in `auth.js`

### 4. Temporary Password Email
* **Trigger**: Forgot Password request
* **Content**: Temporary password with login button and warning about forced password change
* **Sender**: `transporter.sendMail()` in `auth.js`

### 5. Password Change Confirmation
* **Trigger**: Successful password change
* **Content**: Confirmation with timestamp and security warning
* **Sender**: `transporter.sendMail()` in `auth.js`

### 6. New User Welcome Email (Account Creation)
* **Trigger**: New system user created via POST `/api/users`
* **Content**: Email, temporary password, login button, forced change warning
* **Sender**: `transporter.sendMail()` in `users.js`

**Environment Variables Required**: `EMAIL_USER` (Gmail address), `EMAIL_PASS` (Gmail app password)

---

## ⚙️ Project Configuration

### Frontend (`vite.config.js`)
```js
server: {
  proxy: {
    '/api':     { target: 'http://localhost:5000', changeOrigin: true },
    '/login':   { target: 'http://localhost:5000', changeOrigin: true },
    '/verify-otp': { target: 'http://localhost:5000', changeOrigin: true }
  }
}
```

### Backend (`server/server.js`)
- Routes registered at root level (not under `/api` prefix)
- Actual route paths include `/api/` prefix in route files
- Exception: `/login` and `/verify-otp` are mounted at root

### Default Seed Data (`server/dbInit.js`)
- **Default User**: Vinay (Headmaster) — email: `vinay@example.com`, password: `Password@123`
- **Default States**: Bihar (Sasaram, Patna, Gaya), UP (Noida, Lucknow, Kanpur), Karnataka (Bengaluru, Mysore)
- **Default Courses**: BCA, MCA, B.Tech, M.Tech, MBA, BBA, BSc, MSc

---

## ⚡ How to Run the Application

### Prerequisites
- Microsoft SQL Server with Windows Authentication enabled
- Node.js 18+
- Gmail account with App Password (for email features)

### Setup
1. **Clone and install frontend**:
   ```bash
   npm install
   ```

2. **Clone and install backend**:
   ```bash
   cd server
   npm install
   ```

3. **Configure environment**:
   Create a `.env` file in `server/` directory with:
   ```
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   APP_PORT=5000
   APP_URL=http://localhost:5173
   ```

4. **Start Backend Server**:
   ```bash
   cd server
   npm run dev    # (nodemon server.js)
   ```
   *Runs on port 5000. Automatically creates database tables and seeds default data on first run.*

5. **Start Frontend App**:
   ```bash
   npm run dev    # (vite)
   ```
   *Access at `http://localhost:5173`.*

---

## 📌 Summary

This document covers all project work pages (`log_in`, `Otp`, `ChangePassword`, `StudentList`, `CreateStudent`, `updateStudent`, `StudentDesatis`, `PrintStudentId`, `ImportStudent`, `ImportPreview`, `StateMaster`, `CityMaster`, `CourseMaster`, `UserMaster`) along with their backend API endpoints, database schema, authentication flow, role-based access control, email notifications, and reusable components (`CameraModal`, `PieChart`, `Dashboard`).
