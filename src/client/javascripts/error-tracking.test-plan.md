# Error Tracking Manual Test Plan

## Prerequisites

1. Start the development server: `npm run dev`
2. Log in to the application (authentication required)
3. Navigate to any authenticated page (e.g., project name page)
4. Open Chrome DevTools (F12)
5. Open **Network** tab and filter by `browser-logs`
6. Keep **Console** tab visible

## Test 1: Console Error Tracking

**Purpose:** Verify console.error calls are captured and sent

**Steps:**

1. In Console, run: `console.error('Test error message')`

**Expected:**

- Console shows: "Test error message"
- Network tab shows: POST to `/api/browser-logs` with status `204`
- Request payload contains:
  ```json
  {
    "type": "console_error",
    "message": "Test error message",
    "url": "/exemption/project-name",
    "userAgent": "Mozilla/5.0...",
    "timestamp": 1234567890,
    "occurrenceCount": 1
  }
  ```

## Test 2: Uncaught JavaScript Error

**Purpose:** Verify uncaught errors are captured

**Steps:**

1. In Console, run: `setTimeout(() => { throw new Error('Async test error') }, 100)`
2. Wait 200ms

**Expected:**

- Console shows error stack trace
- Network tab shows: POST to `/api/browser-logs` with status `204`
- Payload contains:
  - `"type": "js_error"`
  - `"message": "Uncaught Error: Async test error"`
  - `"stack": "Error: Async test error\n    at..."`

## Test 3: Unhandled Promise Rejection

**Purpose:** Verify promise rejections are captured

**Steps:**

1. In Console, run: `setTimeout(() => { Promise.reject(new Error('Promise test')) }, 100)`
2. Wait 200ms

**Expected:**

- Console shows: "Uncaught (in promise) Error: Promise test"
- Network tab shows: POST to `/api/browser-logs` with status `204`
- Payload contains:
  - `"type": "unhandled_promise"`
  - `"message": "Promise test"`

## Test 4: Deduplication (Max 3 per error type)

**Purpose:** Verify identical errors are limited to 3 occurrences

**Steps:**

1. In Console, run:
   ```javascript
   for (let i = 0; i < 5; i++) {
     console.error('Duplicate error test')
   }
   ```

**Expected:**

- Network tab shows **exactly 3** requests to `/api/browser-logs`
- Request 1 payload: `"occurrenceCount": 1`
- Request 2 payload: `"occurrenceCount": 2`
- Request 3 payload: `"occurrenceCount": 3`
- Requests 4 and 5: Not sent (suppressed)

## Test 5: Burst Protection (Max 10 errors in 10 seconds)

**Purpose:** Verify burst protection prevents error storms

**Steps:**

1. In Console, run:
   ```javascript
   for (let i = 0; i < 15; i++) {
     console.error(`Burst test ${i}`)
   }
   ```

**Expected:**

- Network tab shows **exactly 10** requests to `/api/browser-logs`
- Console shows warning: "Browser error logging paused: too many errors detected"
- Requests 11-15: Not sent (suppressed)

## Test 6: Authentication Required

**Purpose:** Verify unauthenticated users cannot send logs

**Steps:**

1. Log out of the application
2. Navigate to http://localhost:3000/help/privacy
3. In Console, run: `console.error('Logged out test')`

**Expected:**

- Network tab shows: POST to `/api/browser-logs` with status of `302` Request redirects to login

## Test 7: Different Error Types Don't Share Limits

**Purpose:** Verify deduplication is per-error-type

**Steps:**

1. In Console (and logged in again), run:
   ```javascript
   console.error('Error A')
   console.error('Error A')
   console.error('Error A')
   console.error('Error B')
   console.error('Error B')
   console.error('Error B')
   ```

**Expected:**

- Network tab shows **6 requests** (3 for "Error A", 3 for "Error B")
- Each error type gets its own count

## Test 8: Server-Side ECS Log Format

**Purpose:** Verify server logs are formatted correctly

**Steps:**

1. Check server console/logs after running any test above

**Expected:**
Server logs contain ECS-formatted entry with CDP-allowed fields only:

```json
{
  "@timestamp": "2025-11-18T17:56:01.909Z",
  "message": "Test error message",
  "log": {
    "level": "error",
    "logger": "browser"
  },
  "event": {
    "action": "console_error"
  },
  "error": {
    "message": "Test error message",
    "stack_trace": "Error: Test error message\n    at...",
    "type": "Error"
  },
  "user_agent": {
    "original": "Mozilla/5.0..."
  },
  "url": {
    "path": "/exemption/project-name"
  }
}
```

**Key CDP-compliant fields:**

- `error.type`: Error classification (e.g., "Error", "TypeError", "ReferenceError")
- No `log.origin` (file/line removed - not CDP-allowed)
- No `event.sequence` (occurrenceCount removed - not CDP-allowed)
- No `ecs.version` (not needed)

## Notes

- **Session Reset**: Reload the page to reset deduplication and burst protection counters
- **Network Issues**: If `navigator.sendBeacon()` fails, errors are silently suppressed (no console spam)
- **CSRF**: The endpoint has CSRF protection disabled specifically for beacon requests
- **Content-Type**: Requests use `application/json` via Blob constructor
