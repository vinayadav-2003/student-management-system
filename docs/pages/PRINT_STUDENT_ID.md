# PRINT STUDENT ID — `src/pages/PrintStudentId.jsx`

## Purpose
Printable student ID card page. Fetches student details and renders a formatted ID card with photo, student info, and QR code. Automatically triggers browser print dialog on load.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getStudent` |
| `sweetalert2` | Error alerts |
| `react-qr-code` | QR code generation |
| `./PrintStudentId.css` | Card and print-specific styles |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `student` | object/null | `null` | Student data from API |
| `loading` | boolean | `true` | Loading state |

## Key Functions

### Auto-print
On `student` data load, a 600ms timeout triggers `window.print()`.

### QR Code
The QR code encodes a multi-line string with: Name, ID, Course, Phone, City, State.

## ID Card Layout
```
┌──────────────────────────────────────┐
│       Student Identity Card          │
├──────────────────────────────────────┤
│ ┌────────┐  ┌─────────────────────┐  │
│ │ Photo  │  │ STUDENT NAME        │  │
│ │ (or 👤) │  │                     │  │
│ │        │  │ ID : STU001         │  │
│ │        │  │ Course : BCA        │  │
│ │        │  │ City : Delhi        │  │
│ │        │  │ State : Delhi       │  │
│ │        │  │ Phone : 98...       │  │
│ │        │  │ Email : a@b.com     │  │
│ └────────┘  └──────┐ ┌────────────┘  │
│                    │ │ QR CODE      │  │
│                    │ │ Scan For Info│  │
│                    │ └──────────────┘  │
└──────────────────────────────────────┘
```

## Print Styles (CSS)
- **Page size:** 85.6mm × 54mm (credit card size)
- All non-print elements hidden via `.no-print`
- Font sizes and spacing reduced proportionally for the compact layout

## Design Notes
- The card has a 4px blue border with rounded corners.
- Photo box is 120×140px (screen), 16×20mm (print).
- QR code is 70px (screen), 12mm (print).
- Student ID display: prefers `student_id`, else `studentId`, else generates `STU###`.
