# OTP — `src/pages/Otp.jsx`

## Purpose
One-Time Password verification page shown after a successful password login. User enters the 6-digit OTP emailed to them to complete authentication and receive a JWT.

## Dependencies
| Import | Usage |
|--------|-------|
| `axios` | POST `/verify-otp` |
| `react-router-dom` | `useLocation` (receives email from Login), `useNavigate` |

## Props
| Prop | Type | Description |
|------|------|-------------|
| `onLogin` | `function` | Callback invoked after successful OTP verification |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `otp` | string | `""` | 6-digit OTP input, maxLength=6 |

## Key Functions

### `verifyOtp()`
1. POSTs `{ email, otp }` to `/verify-otp`.
2. On success:
   - Stores JWT in `localStorage`.
   - Calls `onLogin()` callback.
   - Checks `sessionStorage.redirectAfterLogin` for post-login redirect; removes it after reading.
   - Navigates to redirect target or default `/read`.
3. On failure → shows `alert("Wrong OTP")`.
4. On network error → shows `alert("OTP Verification Failed")`.

## Flow
```
Login success (password valid)
         │
         ▼
   Navigate to /otp (email in location.state)
         │
         ▼
   User enters 6-digit OTP
         │
         ▼
   POST /verify-otp { email, otp }
         │
     ┌───┴───┐
     │       │
     ▼       ▼
   success  fail
     │       │
     ▼       ▼
  JWT →    alert
  /read
```

## Related Docs
- [LOGIN.md](LOGIN.md) — Navigates here after successful password validation
- [AUTH_ROUTES.md](../routes/AUTH_ROUTES.md) — Backend `/verify-otp` endpoint

## Design Notes
- Email field is disabled/read-only — displayed for confirmation.
- Uses a clean card layout matching the login page design.
- No countdown timer or auto-resend functionality in current implementation.
