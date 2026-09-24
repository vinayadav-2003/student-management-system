# IMPORT PREVIEW — `src/pages/ImportPreview.jsx`

## Purpose
Previews parsed Excel data before final import. Shows each record's validation status (Ready / Duplicate / Missing Email), allows removing individual records, and bulk imports valid records.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `importStudentsBulk` |
| `sweetalert2` | Confirm dialog, success/error |
| `react-router-dom` | `useLocation` (receives excelData), `useNavigate` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `students` | array | `location.state?.excelData \|\| []` | Parsed records with status |
| `loading` | boolean | `false` | Import loading state |

## Key Functions

### `handleRemove(indexToRemove)`
Removes a record from the preview list by index.

### `handleImport()`
1. Filters records with `status === 'Ready'`.
2. If none → shows info alert.
3. Shows confirmation dialog.
4. POSTs to `importStudentsBulk(importable)`.
5. On success → navigates to `/read`.

## Record Statuses & Visual Indicators
| Status | Badge | Row Class | Description |
|--------|-------|-----------|-------------|
| Ready | `bg-info` "Ready to Import" | `table-info-subtle` | Valid record, will be imported |
| Duplicate | `bg-danger` "Duplicate Email" | `table-danger` | Email already exists in DB |
| Missing Email | `bg-warning` "Missing Email" | `table-warning` | No email field in data |

## Table Columns
S.No, Name, Email, Course, State, City, Mobile, Age, Status (badge), Action (Remove button)

## Design Notes
- Table scrollable with sticky header (`maxHeight: 450px`, `overflowY: auto`).
- Import button disabled when no "Ready" records remain.
- Back button returns to `/import` for file re-selection.
