# USER MASTER — `src/pages/UserMaster.jsx`

## Purpose
System user management page. Allows HEADMASTER to create/edit/delete all users (Headmaster, Teacher, Student). TEACHER role can only create/edit/delete STUDENT users. Supports search/filter in the user list.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getUsers`, `createUser`, `updateUser`, `deleteUser` |
| `sweetalert2` | Confirm delete, success/error alerts |
| `react-router-dom` | (none directly; used via parent) |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `users` | array | `[]` | Full user list from API |
| `searchQuery` | string | `""` | Search input for filtering |
| `isEditing` | boolean | `false` | Whether in edit mode |
| `editId` | number/null | `null` | ID of user being edited |
| `name` / `role` / `email` / `phone` | string | Various | Form field values |

## Derived State
| Variable | Source | Description |
|----------|--------|-------------|
| `currentRole` / `currentId` | JWT payload | Controls modification permissions |

## Key Functions

### `handleSave(e)`
1. Validates required fields (name, email, role).
2. If editing: PUTs to `updateUser(editId, payload)`.
3. If creating: POSTs to `createUser(payload)`.
4. Shows success alert, resets form, refreshes list.

### `handleEdit(user)`
Populates form with user data and sets edit mode.

### `handleDelete(id, userName)`
1. Blocks self-deletion.
2. Shows confirmation dialog.
3. DELETEs via API.

### `canModify(targetRole)`
| Current Role | Can Modify |
|-------------|------------|
| HEADMASTER | All roles |
| TEACHER | STUDENT only |

## RBAC Matrix (in-component)
| Action | HEADMASTER | TEACHER | STUDENT |
|--------|------------|---------|---------|
| View list | ✅ | ✅ (all) | ✅ (all) |
| Create | ✅ (all roles) | ✅ (Student only) | ❌ |
| Edit | ✅ (all) | ✅ (Student only) | ❌ |
| Delete | ✅ (except self) | ✅ (Student, not self) | ❌ |

## Layout
- **Left column (col-lg-4):** Add/Edit form with Name, Role (dropdown), Email, Phone, Save/Reset buttons.
- **Right column (col-lg-8):** Searchable table with Name, Role (color-coded badge), Email, Action buttons.

## Role Badge Colors
| Role | Badge Class |
|------|-------------|
| Headmaster | `bg-danger` |
| Teacher | `bg-primary` |
| Student | `bg-secondary` |

## Design Notes
- Form toggles between "Add User" and "Edit User" mode.
- Reset button clears form fields.
- Search filters by Name, Role, or Email.
- When a TEACHER opens this page, they can only manage Student accounts.
