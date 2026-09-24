# AUTH MIDDLEWARE — `server/middleware/auth.js`

## Purpose
JWT authentication middleware that protects all API routes (except login, verify-otp, forgot-password). Validates Bearer tokens, enforces password change requirement, and attaches user info to the request object.

## Dependencies
| Import | Usage |
|--------|-------|
| `jsonwebtoken` | `jwt.verify()` to decode and validate token |

## Flow
```
Request with Authorization: Bearer <token>
         │
         ▼
   Header valid? ──❌──→ 401 "Unauthorized"
         │✅
         ▼
   jwt.verify(token, JWT_SECRET)
         │
     ┌───┴───┐
     │       │
     ▼       ▼
   valid   invalid/expired
     │       │
     ▼       ▼
  Set     401 "Invalid or
  req.user   expired token"
     │
     ▼
   Normalize role to uppercase
     │
     ▼
   requiresPasswordChange &&    ──→ 403 "Password change required"
   !path.endsWith('/change-password')
     │
     ▼
   next()
```

## `req.user` Shape
```js
{
  id: number,
  name: string,
  email: string,
  role: string,         // e.g., "HEADMASTER", "TEACHER", "STUDENT"
  requiresPasswordChange: boolean,
  iat: number,          // issued at
  exp: number           // expiration
}
```

## Key Details
- Role is normalized to uppercase after verification.
- Old tokens without a `role` field get a fallback to `"HEADMASTER"`.
- If `requiresPasswordChange` is true, all routes except `/change-password` are blocked with a 403.
- The `JWT_SECRET` is read from `process.env.JWT_SECRET`.
