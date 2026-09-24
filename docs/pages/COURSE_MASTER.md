# COURSE MASTER — `src/pages/CourseMaster.jsx`

## Purpose
CRUD interface for managing course catalog. Simple single-field entity management. Accessible to HEADMASTER role.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getCourses`, `createCourse`, `updateCourse`, `deleteCourse` |
| `sweetalert2` | Confirm delete, success/error alerts |
| `react-router-dom` | `useNavigate` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `courses` | array | `[]` | Full list of courses |
| `courseName` | string | `""` | New course name input |
| `editingId` | number/null | `null` | ID of course being edited |
| `editingName` | string | `""` | Edit input value |

## Key Functions

### `fetchCourses()`
GETs all courses on mount.

### `handleAdd(e)`
POSTs `{ name: courseName }` → refreshes → dispatches `courseChanged`.

### `handleUpdate(e)`
PUTs `{ name: editingName }` → refreshes.

### `handleDelete(id, name)`
SweetAlert2 confirm → DELETEs → refreshes.

## Layout
- **Left column (col-md-4):** Add/Edit form with text input + Save.
- **Right column (col-md-8):** Table with S.No, Course Name, Actions (Edit, Delete).

## Events
Dispatches `courseChanged` custom event on add/update/delete.

## RBAC
HEADMASTER only.
