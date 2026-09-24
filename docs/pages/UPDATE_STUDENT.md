# UPDATE STUDENT — `src/pages/updateStudent.jsx`

## Purpose
Edit existing student records. Pre-populates the form with current student data, allows photo replacement (via camera or file), and cascading State/City dropdowns.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getStudent`, `updateStudent`, `getStates`, `getCities`, `getCourses` |
| `../components/CameraModal` | Webcam capture modal |
| `sweetalert2` | Validation errors, confirm, success |
| `react-router-dom` | `useParams` (id from URL), `useNavigate` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `form` | object | `{name, email, course, age, mobile, state, city}` | Pre-filled form values |
| `states` / `cities` / `courses` | array | `[]` | Dropdown options |
| `photo` | File/null | `null` | New photo file selected |
| `existingPhoto` | string/null | `null` | Existing Base64 photo from DB |
| `isCameraOpen` | boolean | `false` | Camera modal visibility |

## Key Functions

### `loadData()` (useEffect on mount)
1. Fetches states, courses, and student record in parallel.
2. Pre-fills form fields from student data.
3. Loads existing photo (Base64) if present.
4. If student has a state, fetches cities for that state.

### `handleStateChange(e)`
Same cascading logic as CreateStudent — resets city on state change.

### `handleSubmit(e)`
Same validation as CreateStudent. Builds FormData and PUTs to `updateStudent(id, payload)`.

## Photo Display Priority
1. If user selected a new photo → show preview.
2. Else if student has existing photo → show existing photo.
3. Else → show nothing.

## Design Notes
- Reuses the same form layout as CreateStudent.
- Existing photo is kept unless explicitly replaced.
- All the same validation rules apply.
