# DASHBOARD — `src/components/dasboad.jsx`

## Purpose
Dashboard page showing system stats with a search bar, stat cards, and navigation shortcuts. The central hub after login.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getDashboardStats` |
| `sweetalert2` | Logout confirmation |
| `react-router-dom` | `useNavigate`, `useSearchParams` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `searchQuery` | string | from URL `?search=` | Global search text |
| `stats` | object | `{}` | Dashboard statistics from API |

## Key Features

### Stat Cards
- **Total Students** (👨‍🎓) — displayed with count
- **Total Users** (👥) — displayed with count
- Additional cards as returned by API

### Search Bar
- Input field at the top of the dashboard.
- On submit, navigates to `/read?search=<query>`.
- Pre-populated from URL `?search=` param.

### Navigation Cards
Each card links to a different section of the app:
- 📋 Student List → `/read`
- ➕ Add Student → `/create`
- 📥 Import Excel → `/import`
- 🗺️ State Master → `/state`
- 🏙️ City Master → `/city`
- 📘 Course Master → `/course`
- 👥 User Master → `/users`

### Logout
Clears JWT from localStorage and reloads the page (redirects to login via ProtectedRoute logic).

## Menu Items
| Item | Route | Icon |
|------|-------|------|
| Student List | `/read` | 📋 |
| Add Student | `/create` | ➕ |
| Student Details | `/details` | 👤 |
| Import Excel | `/import` | 📥 |
| Export Excel | *(via StudentList)* | 📤 |
| State Master | `/state` | 🗺️ |
| City Master | `/city` | 🏙️ |
| Course Master | `/course` | 📘 |
| Users Master | `/users` | 👥 |

## Design Notes
- Uses a grid layout with stat summary cards at top.
- Clickable menu cards with hover effects.
- Search bar updates URL params, which StudentList reads.
