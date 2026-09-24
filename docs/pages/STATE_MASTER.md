# STATE MASTER — `src/pages/StateMaster.jsx`

## Purpose
CRUD interface for managing states. Accessible to HEADMASTER role. Supports adding, editing, and deleting state names from the database.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getStates`, `createState`, `updateState`, `deleteState` |
| `sweetalert2` | Confirm delete, success/error alerts |
| `react-router-dom` | `useNavigate` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `states` | array | `[]` | Full list of states |
| `stateName` | string | `""` | New state name input |
| `editingId` | number/null | `null` | ID of state being edited |
| `editingName` | string | `""` | Edit input value |

## Key Functions

### `fetchStates()`
GETs all states from API and updates state list.

### `handleAdd(e)`
POSTs `{ name: stateName }` → creates new state → refreshes list → dispatches `stateChanged` event.

### `handleUpdate(e)`
PUTs `{ name: editingName }` to update existing state → refreshes.

### `handleDelete(id, name)`
Shows SweetAlert2 warning (cities under this state will also be deleted) → DELETEs → refreshes.

## Layout
- **Left column (col-md-4):** Add/Edit form with single text input and Save button.
- **Right column (col-md-8):** Table with S.No, State Name, Actions (Edit, Delete).

## Events
Dispatches `stateChanged` custom event so other components (e.g., CityMaster, CreateStudent) can react.

## RBAC
HEADMASTER only (no explicit check in this component — routing layer handles it).
