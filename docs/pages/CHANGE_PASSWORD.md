# CHANGE PASSWORD — `src/pages/ChangePassword.jsx`

## Purpose
Password update page. Supports both voluntary password changes and forced resets when a user logs in with a temporary password (`requiresPasswordChange` flag in JWT).

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` (instance) | POST `/change-password` |
| `sweetalert2` | Success/error modals |
| `react-router-dom` | `useNavigate` |
| `bootstrap/dist/css/bootstrap.min.css` | Styling |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `oldPassword` | string | `""` | Current/temporary password |
| `newPassword` | string | `""` | Desired new password |
| `confirmPassword` | string | `""` | Confirmation of new password |
| `showOldPassword` | boolean | `false` | Toggle old password visibility |
| `showNewPassword` | boolean | `false` | Toggle new password visibility |
| `showConfirmPassword` | boolean | `false` | Toggle confirm password visibility |
| `error` | string | `""` | Validation/API error |
| `loading` | boolean | `false` | Disables form during request |

## Key Functions

### `handleChangePassword(e)`
1. Validates all fields are non-empty.
2. Validates `newPassword.length >= 8`.
3. Validates password complexity (uppercase, lowercase, digit, special character).
4. Checks new password !== old password.
5. Checks new password === confirmPassword.
6. POSTs `{ oldPassword, newPassword }` to `/change-password`.
7. On success:
   - Shows SweetAlert2 success.
   - If `isForced`: clears token, redirects to `/` (login).
   - Otherwise: navigates to `/read`.

## Derived State
| Variable | Source | Description |
|----------|--------|-------------|
| `isForced` | JWT payload `requiresPasswordChange` | If true, user must change temp password before accessing any other page |

## Validation Rules
| Rule | Error Message |
|------|---------------|
| Any field empty | "All fields are required." |
| New password < 8 chars | "New password must be at least 8 characters long." |
| Missing uppercase, lowercase, digit, or special char | Explicit per-criteria message |
| New password === old password | "New password cannot be the same as your old/temporary password." |
| Confirm mismatch | "New passwords do not match." |

## Design Notes
- Header text and field labels change dynamically based on `isForced` (e.g., "Old / Temporary Password").
- Success modal redirects differently for forced vs voluntary changes.
