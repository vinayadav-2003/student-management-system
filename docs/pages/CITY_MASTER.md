# CITY MASTER — `src/pages/CityMaster.jsx`

## Purpose
CRUD interface for managing cities with state binding. Each city is linked to a state. Accessible to HEADMASTER role.

## Dependencies
| Import | Usage |
|--------|-------|
| `../api` | `getCities`, `createCity`, `updateCity`, `deleteCity`, `getStates` |
| `sweetalert2` | Confirm delete, success/error alerts |
| `react-router-dom` | `useNavigate` |

## Component State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `cities` | array | `[]` | Full list of cities |
| `states` | array | `[]` | States for dropdown |
| `selectedStateId` | string | `""` | Selected state ID for new city |
| `cityName` | string | `""` | New city name input |
| `editingId` | number/null | `null` | ID of city being edited |
| `editingName` | string | `""` | Edit name input |
| `editingStateId` | string | `""` | Edit state ID |

## Key Functions

### `fetchCities()`, `fetchStates()`
Load data on mount.

### `handleAdd(e)`
Validates state selected + name entered → POSTs `{ name, stateId }` → refreshes → dispatches `cityChanged`.

### `handleUpdate(e)`
PUTs `{ name, stateId }` for editing city → refreshes.

### `handleDelete(id, name)`
SweetAlert2 confirm → DELETEs → refreshes.

## Layout
- **Left column (col-md-4):** Form with State dropdown + City name input + Save.
- **Right column (col-md-8):** Table with S.No, State, City Name, Actions (Edit, Delete).
- Input disabled until a state is selected.
- Displays `city.stateName` in the table for readability.

## RBAC
HEADMASTER only.
