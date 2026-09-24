# STUDENT DETAILS — `src/pages/StudentDesatis.jsx`

## Purpose
Complete student profile view with read-only fields, approval status timeline, and an interactive approval workflow panel (Approve / Reject / Return / Forward) for Teacher and Headmaster roles.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getStudent`, `approveStudent`, `getUsers` |
| `sweetalert2` | Confirm/error/success dialogs |
| `react-router-dom` | `useParams`, `useNavigate`, `useSearchParams` |

## Props
None (reads `:id` from URL params).

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `student` | object/null | `null` | Full student profile + approval metadata |
| `showDetails` | boolean | `false` | Toggle approval timeline details |
| `decision` | string | `""` | Selected radio: Approved / Rejected / Returned / Forward |
| `remarks` | string | `""` | Remarks textarea value |
| `forwardUserId` | string | `""` | Target user ID for Forward decision |
| `users` | array | `[]` | List of users for Forward dropdown |

## Derived State
| Variable | Source | Description |
|----------|--------|-------------|
| `role` | JWT payload.role | Determines if approval panel is shown |

## Key Functions

### `handleApproveReject()`
1. Validates decision, remarks, and (if Forward) forwardUserId are selected.
2. Shows SweetAlert2 confirmation dialog with dynamic icon/color based on decision type.
3. POSTs `{ decision, remarks, forwardUserId? }` to `approveStudent(id, payload)`.
4. On success: shows success toast, resets form, reloads student data.
5. On error: shows error alert.

### `loadStudent()`
GETs student full profile with approval metadata.

### `loadUsers()`
GETs all users for the Forward dropdown (only loaded for TEACHER/HEADMASTER roles).

## Approval Flow
```
Student List → Click "Details" button
         │
         ▼
   /student-details/:id
         │
         ├── Read-only student profile (all fields)
         ├── Decision history card (collapsible)
         └── Approval panel (if role = TEACHER/HEADMASTER)
                  │
                  ├── Radio: Approve / Reject / Return / Forward
                  ├── Forward user dropdown (if Forward selected)
                  ├── Remarks textarea
                  └── Submit button
```

## Decision Badge Colors
| Status | Badge Class | Row CSS |
|--------|-------------|---------|
| Approved | `bg-success` | `text-success fw-bold` |
| Rejected | `bg-danger` | `text-danger fw-bold` |
| Returned | `bg-warning` | `text-warning fw-bold` |
| Forwarded / Forward | `bg-info` | `text-info fw-bold` |
| Null / Pending | (no badge) | (no extra class) — displays "Pending" |

## Related Docs
- [STUDENT_LIST.md](STUDENT_LIST.md) — Navigated from via Details button
- [STUDENTS_ROUTES.md](../routes/STUDENTS_ROUTES.md) — Backend approval endpoint (POST `/students/:id/approval`)
- [APP.md](../core/APP.md) — Route definition for `/student-details/:id`

## Design Notes
- If URL has `?action=approve` and `student.canApprove === 1`, the page auto-scrolls to the approval section.
- Forward dropdown excludes the currently assigned approver.
- Collapsible decision history card with ▲/▼ toggle.
- Status field uses dynamic color classes based on `latest_request_status`.
- When `latest_request_status` is null (no approval flow started), the field displays "Pending".
