# MASTERS ROUTES — `server/routes/masters.js`

## Purpose
CRUD endpoints for all master data entities: States, Cities, Courses, and Dashboard statistics. Used by the master management pages and filter dropdowns throughout the app.

## Dependencies
| Import | Usage |
|--------|-------|
| `express.Router` | Route definitions |
| `mssql` | Database queries |
| `../db` | `getPool()` |
| `../middleware/auth` | JWT authentication middleware |

## Mount
```
router.use(authenticate); // All routes require authentication
app.use("/api", router);
```

## Endpoints — States

### `GET /api/states`
Returns all states.

**Response:** Array of `{ id, name }`

### `POST /api/states`
Creates a new state.

**Request:** `{ name }`

### `PUT /api/states/:id`
Updates a state name.

**Request:** `{ name }`

### `DELETE /api/states/:id`
Deletes a state. Cities under this state may also be deleted (cascading).

## Endpoints — Cities

### `GET /api/cities`
Returns cities with optional state filter.

**Query Params:** `stateId` (optional — if omitted, returns all cities)

**Response:** Array of `{ id, name, stateId, stateName }` (joined with States table)

### `POST /api/cities`
Creates a new city linked to a state.

**Request:** `{ name, stateId }`

### `PUT /api/cities/:id`
Updates city name and/or state link.

**Request:** `{ name, stateId }`

### `DELETE /api/cities/:id`
Deletes a city. May fail if linked to existing students.

## Endpoints — Courses

### `GET /api/courses`
Returns all courses.

**Response:** Array of `{ id, name }`

### `POST /api/courses`
Creates a new course.

**Request:** `{ name }`

### `PUT /api/courses/:id`
Updates a course name.

**Request:** `{ name }`

### `DELETE /api/courses/:id`
Deletes a course. May fail if linked to existing students.

## Endpoints — Dashboard

### `GET /api/dashboard/stats`
Returns aggregate counts for the dashboard display.

**Response:**
```json
{
  "students": 150,
  "users": 25,
  "states": 10,
  "cities": 45,
  "courses": 8
}
```

## Design Notes
- All master data endpoints are simple CRUD with no complex business logic.
- Deleting a master record that is referenced by students will fail (foreign key constraint).
- State ID is passed as a query parameter for city filtering.
