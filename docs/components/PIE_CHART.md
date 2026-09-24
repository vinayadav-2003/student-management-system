# PIE CHART — `src/components/PieChart.jsx`

## Purpose
A pure CSS donut chart component using `conic-gradient` to visualize student distribution by State, City, or Course. Supports interactive segment clicking for filtering.

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | `""` | Chart title displayed in header |
| `data` | array | `[]` | Array of `{ label, count }` objects |
| `headerColor` | string | `"#6366f1"` | Header background color |
| `unit` | string | `"Items"` | Label for the center unit text |
| `onSelect` | function | — | Callback with `(label)` when a segment is clicked |
| `onReset` | function | — | Callback when center "All" area is clicked |

## Key Features

### Donut Chart Rendering
- Computes `conic-gradient` string from data proportions.
- Each segment gets a color from a predefined palette.
- CSS `border-radius: 50%` creates the donut shape.
- Center hole displays total count + unit label.

### Interactive Segments
- Each segment label is clickable.
- Clicking a segment calls `onSelect(label)`.
- Clicking the center "All" area calls `onReset()`.

### Legend
- Below the chart, a legend shows each label with its color swatch and count.
- Legend items are also clickable for selection.

## Color Palette
```
#6366f1, #f97316, #ec4899, #10b981, #f59e0b,
#3b82f6, #ef4444, #8b5cf6, #14b8a6, #f43f5e,
#0ea5e9, #84cc16, #eab308, #a855f7, #06b6d4
```

## Design Notes
- Reusable component used 3 times in StudentList (by State, City, Course).
- When a segment is selected (from StudentList), the outer filter dropdown is also set.
- Pure CSS — no canvas or SVG dependencies.
- The center shows "Total: X" with the unit name below.
