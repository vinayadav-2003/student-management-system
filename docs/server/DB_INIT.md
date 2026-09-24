# DB INIT — `server/dbInit.js`

## Purpose
Database schema initialization and seeding script. Creates all required tables (Students, States, Cities, Courses, Users, student_desired, student_flow, matrix) and inserts default seed data.

## Execution
Run once to set up the database:
```bash
node server/dbInit.js
```

## Tables Created

### `Users`
| Column | Type | Notes |
|--------|------|-------|
| Id | INT IDENTITY | Primary key |
| Name | VARCHAR(100) | User's full name |
| Email | VARCHAR(100) | Unique, used for login |
| Password | VARCHAR(100) | Plain text |
| Role | VARCHAR(50) | Headmaster, Teacher, or Student |
| Phone | VARCHAR(20) | Optional |
| Force_Password | CHAR(1) | 'Y' if password change required |

### `Students`
| Column | Type | Notes |
|--------|------|-------|
| Id | INT IDENTITY | Primary key |
| Name | VARCHAR(100) | |
| Email | VARCHAR(100) | Unique |
| Course | VARCHAR(100) | |
| Age | INT | |
| Mobile | VARCHAR(20) | |
| State | VARCHAR(100) | |
| City | VARCHAR(100) | |
| Photo | NVARCHAR(MAX) | Base64 encoded image |
| createdBy | INT | FK → Users.Id |
| createdDate | DATETIME | Default GETDATE() |

### `States`
| Column | Type |
|--------|------|
| Id | INT IDENTITY |
| Name | VARCHAR(100) |

### `Cities`
| Column | Type |
|--------|------|
| Id | INT IDENTITY |
| Name | VARCHAR(100) |
| StateId | INT (FK → States.Id) |

### `Courses`
| Column | Type |
|--------|------|
| Id | INT IDENTITY |
| Name | VARCHAR(100) |

### `student_desired`
| Column | Type | Notes |
|--------|------|-------|
| RequestId | INT IDENTITY | Primary key |
| StudentId | INT | FK → Students.Id |
| Status | CHAR(1) | 'Y' or 'N' |
| Level | INT | Current approval level |
| CreatedBy | INT | FK → Users.Id |

### `student_flow`
| Column | Type | Notes |
|--------|------|-------|
| FlowId | INT IDENTITY | Primary key |
| RequestId | INT | FK → student_desired.RequestId |
| AssignedUserId | INT | FK → Users.Id |
| Decision | VARCHAR(20) | NULL, Approved, Rejected, Returned, Forward |
| Remarks | VARCHAR(500) | |
| UpdatedAt | DATETIME | |

### `matrix`
| Column | Type |
|--------|------|
| Id | INT IDENTITY |
| UserId | INT |
| Level | INT |
| StateId | INT (FK → States.Id) |

## Seed Data

### Default User
| Field | Value |
|-------|-------|
| Name | Vinay |
| Email | vinay@example.com |
| Password | Password@123 |
| Role | Headmaster |
| Force_Password | N |

### Sample States
Delhi, Maharashtra, Uttar Pradesh, Gujarat, Karnataka, Bihar, Tamil Nadu, Rajasthan

### Sample Cities
New Delhi, Mumbai, Lucknow, Ahmedabad, Bengaluru, Patna, Chennai, Jaipur

### Sample Courses
BCA, BBA, B.Tech, B.Com, BA, MBA, MCA, B.Sc

## Design Notes
- All DDL statements use `IF NOT EXISTS` / `IF OBJECT_ID(...) IS NULL` guards for idempotency.
- The script can be run multiple times without errors.
- Sample data is for development/testing purposes.
- The `matrix` table is not seeded — approver assignments must be configured via the User Master or directly in the database.
