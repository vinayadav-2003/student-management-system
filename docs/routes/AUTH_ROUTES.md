# AUTH ROUTES — `server/routes/auth.js`

## Purpose
Authentication and password management endpoints. Handles login (password verification + OTP generation), OTP verification, forgot password (temp password email), and change password.

## Dependencies
| Import | Usage |
|--------|-------|
| `express.Router` | Route definitions |
| `jsonwebtoken` | JWT creation and verification |
| `mssql` | Database queries |
| `../db` | `getPool()` for SQL connection |
| `../services/mailService` | `sendEmail()` for OTP, temp password, password change emails |
| `fs` | Read OTP template from `otp.txt` |
| `path` | Resolve `otp.txt` path |

## Endpoints

### `POST /login`
Verifies email/password, generates OTP, sends OTP email.

**Request:** `{ email, password }`

**Flow:**
1. Query `Users` table for email.
2. If not found → `{ success: false }`.
3. Compare password (plain text — no hashing).
4. If wrong → `{ success: false }`.
5. If `Force_Password = 'Y'` → return JWT with `requiresPasswordChange: true`.
6. Generate 6-digit OTP (from `Math.random()`), store in memory `otpStore` map.
7. Send OTP email via `mailService.sendEmail()`.
8. Return `{ success: true }`.

**Response:**
- Success: `{ success: true, requiresPasswordChange?: boolean, token?: string }`
- Failure: `{ success: false }`

### `POST /verify-otp`
Validates OTP from memory store and issues JWT.

**Request:** `{ email, otp }`

**Flow:**
1. Look up OTP in `otpStore` for email.
2. If missing → `{ success: false, error: "OTP not found" }`.
3. If mismatch → `{ success: false, error: "Wrong OTP" }`.
4. Delete OTP from store.
5. Query user again to get latest data.
6. Create JWT with `{ id, name, email, role, requiresPasswordChange }`.
7. Return `{ success: true, token }`.

### `POST /api/forgot-password`
Generates a temporary password and emails it to the user.

**Request:** `{ email }`

**Flow:**
1. Query user by email.
2. If not found → `{ success: false, error: "Email not registered" }`.
3. Generate temporary password (8 chars: uppercase + 4 digits + uppercase).
4. Update `Password` and `Force_Password = 'Y'` in DB.
5. Send email with temporary password.
6. Return `{ success: true, message }`.

### `POST /api/change-password`
Updates user password with complexity validation.

**Request:** `{ oldPassword, newPassword }` (headers: `Authorization: Bearer <token>`)

**Flow:**
1. Authenticate via middleware.
2. Verify old password matches current DB value.
3. Validate new password complexity (min 8 chars, uppercase, lowercase, digit, special).
4. Update password in DB, set `Force_Password = 'N'`.
5. Send confirmation email.
6. Return `{ success: true }`.

## In-Memory State
```js
const otpStore = new Map(); // email -> 6-digit OTP string
```
OTPs are stored in server memory (lost on restart). Each OTP can only be used once (deleted after successful verification).

## ⚠️ Security Notes

### Passwords Stored in Plain Text
Passwords are stored and compared as **plain text** — no hashing is performed. This is a known limitation and should be addressed for production use.

### OTP Store (In-Memory)
```js
const otpStore = new Map(); // email → 6-digit OTP string
```
- OTPs are stored in server memory — **lost on restart**.
- OTPs are generated from `Math.random()` — **not cryptographically secure**.
- OTPs can only be used once (deleted after verification).
- **No expiry mechanism** — OTPs persist until used or server restart.

### JWT
- JWT secret comes from `process.env.JWT_SECRET`.
- Tokens include `{ id, name, email, role, requiresPasswordChange }`.
- Token expiration should be configured via `expiresIn` option.

### Password Change Flow
- `Force_Password` flag tracks whether user must change their password.
- API blocks all non-password-change routes when `requiresPasswordChange` is true (enforced in auth middleware).
