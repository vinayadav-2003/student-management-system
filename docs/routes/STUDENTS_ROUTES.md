# STUDENTS ROUTES — `server/routes/students.js`

## Purpose
Core student management endpoints: CRUD with photo handling, pagination with multi-filter, Excel import/export, approval workflow, and aggregate statistics.

## Dependencies
| Import | Usage |
|--------|-------|
| `express.Router` | Route definitions |
| `mssql` | Database queries |
| `multer` | Multipart file upload parsing (for photo + Excel) |
| `xlsx` | Excel file parsing (preview) |
| `../db` | `getPool()` |
| `../middleware/auth` | JWT authentication |
| `../services/mailService` | Welcome email, approval notifications |

## Mount
```
router.use(authenticate); // Applied to all routes
app.use("/api", router);
```

## Endpoints

### `GET /api/students`
Paginated student list with multi-filters.

**Query Params:** `page`, `limit`, `search`, `state`, `city`, `course`

**Flow:**
1. Builds dynamic SQL query with `OFFSET`/`FETCH NEXT` for pagination.
2. Applies filters via `WHERE` clauses with `LIKE %search%` for text search.
3. Uses `OUTER APPLY` to join latest approval status.
4. Returns `{ students: [...], total: number }`.

### `GET /api/students/aggregates`
Returns count of students grouped by state, city, and course for pie charts.

**Response:** `{ states: [{label, count}], cities: [{label, count}], courses: [{label, count}] }`

### `GET /api/students/:id`
Full student details with approval metadata.

**Flow:**
1. Queries student with LEFT JOIN on `student_desired` and `student_flow` for latest decision.
2. Computes `canApprove` flag: checks if the requesting user is the assigned approver at the current pending level.
3. Returns full student object including `photo` (Base64), approval status, decision history.

### `POST /api/students`
Creates a new student.

**Middleware:** `upload.single('photo')` (multer)

**Request:** FormData with `name, email, course, age, mobile, state, city, photo (file)`

**Flow:**
1. Check for duplicate email → `400 "Student with this email already exists"`.
2. If photo uploaded, convert buffer to Base64 string.
3. Insert into `Students` table with `OUTPUT INSERTED.*`.
4. Send welcome email (error does not block creation).
5. Look up approval matrix for the student's state.
6. If approvers exist, create `student_desired` + `student_flow` rows.
7. Return created student with `{ emailSent, emailError? }`.

### `PUT /api/students/:id`
Updates an existing student.

**Middleware:** `upload.single('photo')` (multer)

**Request:** FormData with updated fields + optional photo.

**Flow:**
1. If photo uploaded, convert to Base64.
2. Update `Students` table.
3. Return `{ success: true }`.

### `DELETE /api/students/:id`
Deletes a student.

**Response:** `{ success: true, message }`

### `POST /api/students/:id/approval`
Approval workflow action.

**Request:** `{ decision: "Approved"|"Rejected"|"Returned"|"Forward", remarks, forwardUserId? }`

**Flow:**
1. Validate decision enum value.
2. Validate `forwardUserId` required for "Forward".
3. Check student exists and has a pending approval.
4. Verify the requesting user is the assigned approver.
5. If Forward: validate target user exists.
6. Update `student_desired` and `student_flow` tables.
7. If Forward: create new flow entry for target user; if Approve: check next level; etc.
8. Send notification emails accordingly.

### `GET /api/export/students/excel`
Exports all students as an XLSX file.

**Response:** Binary XLSX file download.

### `POST /api/upload/students/excel/preview`
Parses uploaded Excel, validates each row (duplicate check, missing email).

**Request:** Multipart with `file` field.

**Response:** `{ excelData: [{ Name, Email, Course, State, City, Mobile, Age, status }] }`

### `POST /api/upload/students/excel/import`
Bulk imports validated student records from parsed Excel data.

**Request:** `{ students: [...] }`

**Response:** `{ imported: number, errors: [...] }`

## Approval Workflow
```
Student Created → student_desired created → level 1 approver assigned
  → Level 1: Approve/Reject/Return/Forward
    → Forward: assign to specific user
    → Return: back to level 1
    → Reject: status updated
    → Approve: check for next level
      → Next level exists: promote to level 2
      → No next level: final approval, status = "Approved"
```

## Design Notes
- Photos stored as Base64 strings in the database.
- Multer configured with memory storage (no disk writes).
- Approval levels defined in `matrix` table (state-level → approver mapping).
- Email failures during student creation are non-blocking (student saved, email error reported).
