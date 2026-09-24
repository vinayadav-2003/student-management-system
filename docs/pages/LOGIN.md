# LOGIN — `src/pages/log_in.jsx`

## Purpose
User authentication entry point with email/password login, CAPTCHA verification, OTP redirection, and a Forgot Password toggle. It is the landing page for unauthenticated users.

## Dependencies
| Import | Usage |
|--------|-------|
| `axios` | POST requests to `/login` and `/api/forgot-password` |
| `react-simple-captcha` | CAPTCHA generation and validation (`loadCaptchaEnginge`, `LoadCanvasTemplateNoReload`, `validateCaptcha`) |
| `react-router-dom` | `useNavigate` for programmatic redirect |
| `bootstrap/dist/css/bootstrap.min.css` | Styling |

## Props
| Prop | Type | Description |
|------|------|-------------|
| `onLogin` | `function` | Callback invoked after successful OTP verification or when a forced password-change token is stored |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `email` | string | `""` | Login email input |
| `password` | string | `""` | Login password input |
| `error` | string | `""` | Error message displayed in a danger alert |
| `loading` | boolean | `false` | Disables form during request |
| `captchaInput` | string | `""` | User-entered CAPTCHA text |
| `forgotMode` | boolean | `false` | Toggles between Login form and Forgot Password form |
| `forgotEmail` | string | `""` | Email input for forgot-password flow |
| `forgotSuccess` | string | `""` | Success message for forgot-password flow |
| `showPassword` | boolean | `false` | Toggles password visibility |

## Key Functions

### `handleLogin()`
1. Validates CAPTCHA; regenerates on failure.
2. POSTs `{ email, password }` to `/login`.
3. On success:
   - If `requiresPasswordChange` is true → stores JWT in localStorage, calls `onLogin()`, navigates to `/change-password`.
   - Otherwise → navigates to `/otp` with `{ state: { email } }`.
4. On failure → displays error and regenerates CAPTCHA.

### `handleForgotPassword()`
1. Validates email is non-empty.
2. POSTs `{ email }` to `/api/forgot-password`.
3. On success → displays success message and clears email input.

## Flow Diagram
```
User enters email + password + CAPTCHA
         │
         ▼
   Validate CAPTCHA ──❌──→ Refresh CAPTCHA + show error
         │✅
         ▼
   POST /login
         │
     ┌───┴───┐
     │       │
     ▼       ▼
 token?   success
     │       │
     ▼       ▼
 ForcePwd   OTP page
     │       │
     ▼       ▼
 /change   /otp
-password
```

## RBAC
No authentication required — this is a public page.

## Related Docs
- [OTP.md](OTP.md) — Navigated to after successful password validation
- [CHANGE_PASSWORD.md](CHANGE_PASSWORD.md) — Navigated to when forced password change required
- [AUTH_ROUTES.md](../routes/AUTH_ROUTES.md) — Backend `/login` and `/api/forgot-password` endpoints

## Design Notes
- Uses a custom form card with a dark header and avatar circle.
- CAPTCHA uses canvas-rendered text via `LoadCanvasTemplateNoReload`.
- Forgot Password mode shares the same card layout.
- Enter key triggers form submission.
