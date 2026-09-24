# PROTECTED ROUTE — `src/ProtectedRoute.jsx`

## Purpose
Route guard component that wraps pages requiring authentication. Redirects unauthenticated users to the login page and handles the forced password change flow.

## Dependencies
| Import | Usage |
|--------|-------|
| `react-router-dom` | `Navigate`, `useLocation` |

## Props
| Prop | Type | Description |
|------|------|-------------|
| `children` | ReactNode | The protected component to render |

## Key Functions

### Token Validation
1. Reads JWT from `localStorage.getItem('token')`.
2. If no token → redirects to `/` (login) with current path saved in `sessionStorage.redirectAfterLogin`.
3. Decodes JWT payload (`JSON.parse(atob(token.split('.')[1]))`).
4. Checks `exp * 1000 > Date.now()`.

### Password Change Guard
If `payload.requiresPasswordChange` is true, redirects to `/change-password` for all routes except `/change-password` itself.

## Flow
```
User navigates to protected route
         │
         ▼
   Token in localStorage?
      ┌──┴──┐
      NO    YES
      │      │
      ▼     ▼
   Save     Token expired?
   current   ┌──┴──┐
   path     YES    NO
   in       │      │
   session  ▼     ▼
   Storage  /    requiresPasswordChange?
         (login)  ┌──┴──┐
                  YES    NO
                  │      │
                  ▼     ▼
              /change-  Render
              password  children
```

## Design Notes
- After login, the user is redirected to the page they originally tried to access (stored in `sessionStorage.redirectAfterLogin`).
- The token expiration check prevents using stale JWTs.
