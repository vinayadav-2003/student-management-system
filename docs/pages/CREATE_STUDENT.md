# CREATE STUDENT — `src/pages/CreateStudent.jsx`

## Purpose
Student registration form with cascading State/City dropdowns, course selection, photo capture/upload, and full client-side validation.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `createStudent`, `getStates`, `getCities`, `getCourses` |
| `../components/CameraModal` | Webcam photo capture modal |
| `sweetalert2` | Validation errors, confirm dialogs, success messages |
| `react-router-dom` | `useNavigate` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `form` | object | `{name, email, course, age, mobile, state, city}` | Form field values |
| `states` | array | `[]` | State dropdown options |
| `cities` | array | `[]` | City dropdown options (filtered by selected state) |
| `courses` | array | `[]` | Course dropdown options |
| `photo` | File/null | `null` | Selected photo file object |
| `isCameraOpen` | boolean | `false` | Camera modal visibility |

## Key Functions

### `handleStateChange(e)`
Updates selected state, resets city selection, and fetches cities for the chosen state from API.

### `handleChange(e)`
Generic handler for text/select inputs using `e.target.name`.

### `handleSubmit(e)`
1. Validates all fields client-side.
2. Shows SweetAlert2 confirmation dialog.
3. Builds `FormData` with all form fields + optional photo.
4. POSTs to `createStudent(payload)`.
5. On success: shows appropriate success/warning alert based on `emailSent` flag.
6. Navigates to `/read`.

## Validation Rules
| Field | Rule |
|-------|------|
| Name | Non-empty |
| Email | Must match `/\S+@\S+\.\S+/` |
| State | Non-empty |
| City | Non-empty |
| Course | Non-empty |
| Mobile | Exactly 10 digits `/^[0-9]{10}$/` |
| Age | Must be between 10 and 100 |
| Photo | Required (non-null) |

## Data Flow
```
Component mounts
  → Fetch states + courses in parallel
  → User selects state
    → Fetch cities for that state
  → User fills form + selects photo (file or camera)
  → Submit: FormData → POST /api/students
  → Backend: insert student, send welcome email, create approval flow
  → Frontend: show result → navigate to /read
```

## Related Docs
- [UPDATE_STUDENT.md](UPDATE_STUDENT.md) — Edit form with same layout
- [CAMERA_MODAL.md](../components/CAMERA_MODAL.md) — Webcam capture modal
- [STUDENT_LIST.md](STUDENT_LIST.md) — List page (navigated to on success)
- [STUDENTS_ROUTES.md](../routes/STUDENTS_ROUTES.md) — Backend POST endpoint

## Design Notes
- State and City use `<select>` with cascading dependency (city disabled until state selected).
- Course is an independent dropdown (not dependent on state/city).
- Photo can be uploaded via file input or captured via CameraModal (webcam).
- Photo preview shown after selection with object URL.
- Cancel button returns to `/read`.
