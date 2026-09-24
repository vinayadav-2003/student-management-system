# MAIL SERVICE — `server/services/mailService.js`

## Purpose
Email notification service using Nodemailer. Sends 6 types of transactional emails: OTP verification, welcome email, temporary password, password change confirmation, pending approval notification, and new user credentials.

## Dependencies
| Import | Usage |
|--------|-------|
| `nodemailer` | SMTP email transport |
| `path` | Resolve email template paths |
| `fs` | Read HTML template files |

## Configuration
Reads SMTP credentials from environment variables:
| Variable | Description |
|----------|-------------|
| `EMAIL_HOST` | SMTP host (e.g., smtp.gmail.com) |
| `EMAIL_PORT` | SMTP port (e.g., 587) |
| `EMAIL_USER` | SMTP username/email |
| `EMAIL_PASS` | SMTP password/app password |
| `EMAIL_FROM` | Sender address (defaults to EMAIL_USER) |

## Exported Function

### `sendEmail({ to, subject, text, html })`
Generic email sender using Nodemailer.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | ✅ | Recipient email address |
| `subject` | string | ✅ | Email subject line |
| `text` | string | ❌ | Plain text body |
| `html` | string | ❌ | HTML body (preferred) |

## Email Templates

### 1. OTP Email
- **Trigger:** Successful password login.
- **Content:** 6-digit OTP code.
- **Template:** `otp.txt` (from project root `server/otp.txt`).

### 2. Welcome Email
- **Trigger:** New student created via form.
- **Content:** Name, email, registration confirmation.

### 3. Temporary Password Email
- **Trigger:** Forgot password flow.
- **Content:** Temporary password and instructions to log in and change.

### 4. Password Change Confirmation
- **Trigger:** Successful password change.
- **Content:** Confirmation that password was updated.

### 5. Pending Approval Notification
- **Trigger:** New student created and assigned to an approver.
- **Content:** Student details and request to review.

### 6. New User Credentials
- **Trigger:** Admin creates a new user (via UserMaster).
- **Content:** Login credentials, role, and instructions.
