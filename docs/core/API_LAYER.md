# API LAYER — `src/api.jsx`

## Purpose
Centralized Axios client configuration and endpoint functions. All API calls in the frontend go through this module. Handles JWT injection, 401 interception, and provides named export functions for every backend endpoint.

## Axios Instance
```js
const api = axios.create({ baseURL: '/api' });
```
- Uses relative URL `/api` which is proxied by Vite to `localhost:5000` during development.
- With `server/routes/index.js`, the backend remaps `/api` routes.

## Interceptors

### Request Interceptor
Attaches `Authorization: Bearer <token>` header from `localStorage` to every request.

### Response Interceptor
On 401 response, clears localStorage token and reloads the page (which redirects to login via `ProtectedRoute` logic).

## Exported Functions

### Student Endpoints
| Function | Method | Path | Description |
|----------|--------|------|-------------|
| `getStudent(id)` | GET | `/students/:id` | Single student details |
| `createStudent(data)` | POST | `/students` | Create new student (FormData) |
| `updateStudent(id, data)` | PUT | `/students/:id` | Update student (FormData) |
| `deleteStudent(id)` | DELETE | `/students/:id` | Delete student |
| `getStudents(page, limit, search, state, city, course)` | GET | `/students` | Paginated list with filters |
| `getStudentsAggregates()` | GET | `/students/aggregates` | State/City/Course counts |
| `approveStudent(id, data)` | POST | `/students/:id/approval` | Submit approval decision |

### Excel Import/Export
| Function | Method | Path | Description |
|----------|--------|------|-------------|
| `exportStudentsExcel()` | GET | `/export/students/excel` | Download XLSX (`responseType: 'blob'`) |
| `previewStudentsExcel(formData)` | POST | `/upload/students/excel/preview` | Parse and validate Excel |
| `importStudentsBulk(students)` | POST | `/upload/students/excel/import` | Bulk insert valid records |

### Master Data — States
| Function | Method | Path |
|----------|--------|------|
| `getStates()` | GET | `/states` |
| `createState(data)` | POST | `/states` |
| `updateState(id, data)` | PUT | `/states/:id` |
| `deleteState(id)` | DELETE | `/states/:id` |

### Master Data — Cities
| Function | Method | Path |
|----------|--------|------|
| `getCities(stateId?)` | GET | `/cities?stateId=` |
| `createCity(data)` | POST | `/cities` |
| `updateCity(id, data)` | PUT | `/cities/:id` |
| `deleteCity(id)` | DELETE | `/cities/:id` |

### Master Data — Courses
| Function | Method | Path |
|----------|--------|------|
| `getCourses()` | GET | `/courses` |
| `createCourse(data)` | POST | `/courses` |
| `updateCourse(id, data)` | PUT | `/courses/:id` |
| `deleteCourse(id)` | DELETE | `/courses/:id` |

### Dashboard & Users
| Function | Method | Path |
|----------|--------|------|
| `getDashboardStats()` | GET | `/dashboard/stats` |
| `getUsers()` | GET | `/users` |
| `createUser(data)` | POST | `/users` |
| `updateUser(id, data)` | PUT | `/users/:id` |
| `deleteUser(id)` | DELETE | `/users/:id` |

## Design Notes
- All student CRUD functions use the `api` instance, which automatically attaches the JWT.
- File uploads (createStudent, updateStudent, previewStudentsExcel) explicitly set `Content-Type: multipart/form-data`.
- Export function returns a blob for file download via temporary anchor element.
- No error handling here — errors propagate to calling components.
