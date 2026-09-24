# USERS ROUTES — `server/routes/users.js`

## Purpose
User management CRUD endpoints. Supports creating, reading, updating, and deleting system users (Headmasters, Teachers, Students). Includes password reset triggers and role-based access control.

## Dependencies
| Import | Usage |
|--------|-------|
| `express.Router` | Route definitions |
| `mssql` | Database queries |
| `../db` | `getPool()` |
| `../middleware/auth` | JWT authentication middleware |
| `../services/mailService` | Welcome/password reset emails |

## Mount
```
router.use(authenticate); // All routes require authentication
app.use("/api", router);
```

## Helper: `getApproverForLevel(pool, level)`
Queries the `matrix` table for the first user at a given approval level level. Used when creating new student users.

## Endpoints

### `GET /api/users`
Returns all users. Note: TEACHER role can only see STUDENT users.

**Auth:** All authenticated users.

**Query:** Optional `role` filter.

**Response:** Array of `{ Id, Name, Role, Email, Phone }`

### `POST /api/users`
Creates a new user, generates a random password, sends a welcome/reset email, and optionally creates an approval flow entry if the user is a Student.

**Request:** `{ name, role, email, phone? }`

**Flow:**
1. Check if email already exists → `400 "Email already exists"`.
2. Insert into `Users` table.
3. Get the inserted user's ID.
4. Generate random password (8 chars).
5. Update password in DB, set `Force_Password = 'Y'`.
6. Send welcome email with credentials.
7. If role is `Student`, creates a `student_flow` entry if an approver exists.

**Response:** `{ success: true, message, user: { id, name, role, email } }`

### `PUT /api/users/:id`
Updates user details (name, role, email, phone). Cannot change own role.

**Request:** `{ name, role, email, phone? }`

**Response:** `{ success: true, message }`

### `DELETE /api/users/:id`
Deletes a user. Self-deletion is blocked at the backend.

**Response:** `{ success: true, message }`

## RBAC Notes
- The frontend `UserMaster.jsx` handles role-based visibility for Edit/Delete buttons.
- Backend does not enforce role-based restrictions on these endpoints (all authenticated users can manage users).
- However, self-deletion is prevented server-side.
