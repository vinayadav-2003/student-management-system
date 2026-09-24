# CAMERA MODAL — `src/components/CameraModal.jsx`

## Purpose
A Bootstrap modal that captures a photo using the device's webcam. Uses the native `MediaDevices.getUserMedia` API to access the camera, captures a snapshot, and returns it as a File object.

## Dependencies
| Import | Usage |
|--------|-------|
| React `useRef` | Video element reference for canvas capture |
| `bootstrap` | Modal via `data-bs-*` attributes or manual control |
| `bootstrap/dist/css/bootstrap.min.css` | Styling |

## Props
| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Controls modal visibility |
| `onClose` | function | Callback to close the modal |
| `onCapture` | function | Callback receiving the captured `File` object |

## Key Functions

### Camera Access
Uses `navigator.mediaDevices.getUserMedia({ video: true })` to stream webcam to a `<video>` element.

### Capture
Draws the current video frame onto a `<canvas>` element, converts to JPEG blob via `canvas.toBlob()`, creates a `File` object named `camera-photo.jpg`, and calls `onCapture(file)`.

### Cleanup
On close/unmount, stops all media tracks using `stream.getTracks().forEach(track => track.stop())`.

## Flow
```
User clicks "Camera" button
  → Modal opens
  → Browser requests camera permission
  → Webcam stream displayed in <video>
  → User clicks "Capture"
  → Snapshot taken via canvas
  → File object returned to parent
  → Modal closes
```

## Design Notes
- The modal includes a live video preview and a "Capture" button.
- After capture, the modal auto-closes and the parent component receives the file.
- Camera stream is properly released on modal close to free the device.
