# APP — `src/App.jsx`

## Purpose
Root React component that configures routing, global authentication state, navigation header with role-based menus, and user dropdown (profile info, role, logout).

## Dependencies
| Import | Usage |
|--------|-------|
| `react-router-dom` | `Routes`, `Route`, `Link`, `Navigate`, `useLocation`, `useNavigate` |
| `react` | `useState`, `useEffect` |
| All page components | Route rendering |
| `ProtectedRoute` | Auth guard wrapper |
| `./App.css` | Custom app styles |
| `bootstrap/dist/css/bootstrap.min.css` | Base styling |

## State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `isLoggedIn` | boolean | `isTokenValid()` | Reactive auth state |
| `mustChange` | boolean | derived | Whether user has `requiresPasswordChange` flag |
| `showDropdown` | boolean | `false` | User dropdown menu visibility |

## Derived State
| Variable | Source | Description |
|----------|--------|-------------|
| `userRole` | JWT payload role | Controls menu visibility |
| `userName` | JWT payload name | Displayed in avatar/badge |
| `userEmail` | JWT payload email | Displayed in dropdown |
| `studentCount` | `getDashboardStats` API (via custom event) | Badge showing total student count |

## Route Map
| Path | Component | Protected | Notes |
|------|-----------|-----------|-------|
| `/` | `Login` | ❌ | Public entry |
| `/otp` | `Otp` | ❌ | After password validation |
| `/change-password` | `ChangePassword` | ✅ | Also accessible with forced flag |
| `/dashboard` | `Dashboard` | ✅ | Main hub after login |
| `/read` | `StudentList` | ✅ | Student table |
| `/create` | `CreateStudent` | ✅ | Registration form |
| `/update/:id` | `UpdateStudent` | ✅ | Edit form |
| `/student-details/:id` | `StudentDetails` | ✅ | Profile + approval |
| `/print-student/:id` | `PrintStudentId` | ✅ | ID card (no header) |
| `/import` | `ImportStudent` | ✅ | Excel upload |
| `/import-preview` | `ImportPreview` | ✅ | Preview before import |
| `/state` | `StateMaster` | ✅ | State CRUD |
| `/city` | `CityMaster` | ✅ | City CRUD |
| `/course` | `CourseMaster` | ✅ | Course CRUD |
| `/users` | `UserMaster` | ✅ | User management |

## Key Functions

### `isTokenValid()`
Checks localStorage for a JWT and verifies `exp` is not expired.

### `requiresPasswordChange()`
Parses JWT and returns `payload.requiresPasswordChange`.

### `onLogin()`
Updates `isLoggedIn` state and reloads student count.

### `handleLogout()`
Clears localStorage and reloads the page.

## Navigation Header
- **Left:** Brand logo + navigation links based on role.
- **Right:** User avatar/name dropdown with profile info, role badge, and Logout.
- **Student count badge** next to "Students" link, updated via `studentCountChanged` window event.

## Related Docs
- [PROTECTED_ROUTE.md](PROTECTED_ROUTE.md) — Route guard component
- [API_LAYER.md](API_LAYER.md) — Axios client and endpoint functions
- [DASHBOARD.md](../components/DASHBOARD.md) — Main dashboard after login
- [All pages](../pages/) — Individual page documentation
- [STUDENTS_ROUTES.md](../routes/STUDENTS_ROUTES.md) — Backend API endpoints

## Shared CSS Classes
Component-level styles are defined in `src/App.css` and `src/index.css`. Key shared classes:

| Class | Purpose | Used By |
|-------|---------|---------|
| `.form-wrapper` | Centered flex container | Login, ChangePassword, CreateStudent, UpdateStudent |
| `.form-card` | White card with shadow | All form-based pages |
| `.form-header` | Dark header section | All form-based pages |
| `.avatar-circle` | Icon/emoji circle in header | All form-based pages |
| `.btn-submit` | Primary submit button | All form-based pages |

## Design Notes
- Print page (`/print-student/:id`) hides the navigation header.
- `ProtectedRoute` redirects to `/` (login) if not authenticated.
- If `mustChange` is true, all routes except `/change-password` are blocked.
- The student count is fetched from dashboard stats and re-fetched on `studentCountChanged` event.
