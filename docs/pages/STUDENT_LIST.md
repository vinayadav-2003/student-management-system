# STUDENT LIST — `src/pages/StudentList.jsx`

## Purpose
Main data table page for browsing, filtering, exporting, and managing student records. Displays 3 pie charts (State/City/Course aggregates) at the top, followed by a filterable table with pagination and action buttons (Print ID, Update, Delete).

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getStudents`, `deleteStudent`, `exportStudentsExcel`, `getStates`, `getCities`, `getCourses`, `getStudentsAggregates` |
| `../components/PieChart` | Interactive conic-gradient donut charts |
| `sweetalert2` | Delete confirmation, export success modals |
| `react-router-dom` | `useNavigate`, `useSearchParams` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `students` | array | `[]` | Paginated student records |
| `page` | number | `1` | Current page number |
| `total` | number | `0` | Total matching records |
| `states` / `cities` / `courses` | array | `[]` | Filter dropdown options |
| `selectedState` / `selectedCity` / `selectedCourse` | string | `""` | Active filter values |
| `aggregates` | object | `{states,cities,courses}` | Pie chart data from API |
| `filterEnteredByMe` | boolean | `false` | Show only students created by current user |
| `filterPendingDetails` | boolean | `false` | Show only pending/forwarded/returned students |

## Derived State
| Variable | Source | Description |
|----------|--------|-------------|
| `searchQuery` | URL `?search=` param | Global search text |
| `userRole` | JWT payload.role | Controls visibility of Import/Update/Delete buttons |
| `currentUserId` | JWT payload.id | Used for "Entered by me" filter |
| `totalPages` | `Math.ceil(total / limit)` | Calculated for pagination |
| `limit` | const `10` | Items per page |

## Key Functions

### `fetchStudents(pageNumber, query, state, city, course)`
Fetches paginated student list from API with filter params.

### `handleExportExcel()`
Calls `exportStudentsExcel()` to download an XLSX blob.

### `handleDelete(id)`
Shows SweetAlert2 confirmation → calls `deleteStudent(id)` → refreshes list.

### `handleUpdate(id)`
Navigates to `/update/:id` with student data in location state.

### `printStudent(student)`
Opens `/print-student/:id` in a new popup window for ID card printing.

## Filter Tabs
| Tab | CSS Class | Description |
|-----|-----------|-------------|
| All Students | `btn-outline-primary active` | No filter |
| Enterby me | `btn-outline-primary` | Filters by `createdBy === currentUserId` |
| Pending details | `btn-outline-warning` | Filters by pending/forwarded/returned/null status |

## Column Sets
The table renders **two different column layouts** depending on active filter:

**Default / Enterby me:** S.No, Student ID, Name, Email, Course, State, City, Mobile, Age, Action (Print ID, Update, Delete)

**Pending details:** S.No, Student ID, Name, Course, Status, Action (Details button)

## Related Docs
- [CREATE_STUDENT.md](CREATE_STUDENT.md) — Navigated to via "Add New" button (in Dashboard)
- [UPDATE_STUDENT.md](UPDATE_STUDENT.md) — Navigated to via Update action
- [STUDENT_DETAILS.md](STUDENT_DETAILS.md) — Navigated to via Details button
- [PRINT_STUDENT_ID.md](PRINT_STUDENT_ID.md) — ID card printing
- [IMPORT_STUDENT.md](IMPORT_STUDENT.md) — Excel import flow
- [PIE_CHART.md](../components/PIE_CHART.md) — Aggregate chart component
- [STUDENTS_ROUTES.md](../routes/STUDENTS_ROUTES.md) — Backend endpoints

## Design Notes
- Pie charts allow interactive filtering: clicking a slice sets that filter value and resets others.
- Export Excel downloads via `Blob` + temporary `<a>` tag.
- Pagination buttons at bottom with "Page X of Y" display.
- `studentCountChanged` custom event dispatched on delete for header badge updates.
