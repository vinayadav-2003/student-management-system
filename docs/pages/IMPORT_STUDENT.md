# IMPORT STUDENT — `src/pages/ImportStudent.jsx`

## Purpose
Excel file upload page. Allows users to select an `.xlsx`/`.xls` file, download a sample template, and preview parsed data before bulk importing.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `previewStudentsExcel` |
| `sweetalert2` | Download confirmation, warnings, and errors |
| `react-router-dom` | `useNavigate` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `file` | File/null | `null` | Selected Excel file |
| `loading` | boolean | `false` | Processing state |

## Key Functions

### `handleDownloadTemplate()`
Creates a temporary `<a>` tag to download `/sample.xlsx` from the public directory.

### `handlePreview()`
1. Validates file is selected.
2. Builds FormData with the file.
3. POSTs to `previewStudentsExcel(formData)`.
4. On success → navigates to `/import-preview` with `{ state: { excelData } }`.
5. On error → shows SweetAlert2 error.

## Flow
```
Import Student Page
  ├── 📥 Download Excel Template → public/sample.xlsx
  ├── 📂 Select .xlsx file
  └── 🔍 Preview Data → POST /upload/students/excel/preview
                            │
                            ▼
                     /import-preview
```

## Design Notes
- Accepts `.xlsx` and `.xls` file extensions.
- Shows spinner during processing.
- Cancel button returns to `/read`.
