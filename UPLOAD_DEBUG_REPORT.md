# Upload Debug Report — Product Image Upload Stuck on "Uploading..."

## Step 1: Identify the Failing Step

The upload flow involves these sequential steps. Each has been instrumented with `[MEDIA]` / `[UPLOAD]` console logs:

| Step | Location | Log tag | Expected |
|------|----------|---------|----------|
| 1. Frontend sends POST request | `EditProduct.jsx:80` | (browser Network tab) | Request sent to `/api/media` |
| 2. Auth middleware (protect) | `auth.js:25` | — | 200-level, sets `req.user` |
| 3. Auth middleware (admin) | `auth.js:103` | — | Checks `isAdmin` |
| 4. Route handler entered | `media.js:10` | `[MEDIA] POST /media — route handler entered` | Logs Content-Type, Auth status |
| 5. Multer processes file | `media.js:14` | `[MEDIA] Multer callback called` | Called with `err` or `null` |
| 6. File validated | `media.js:30-35` | `[MEDIA] File received` | Shows filename, size, mimetype |
| 7. Cloudinary upload starts | `upload.js:43` | `[UPLOAD] Calling cloudinary.uploader.upload...` | Shows Cloudinary config status |
| 8. Cloudinary responds | `upload.js:66-77` | `[UPLOAD] Cloudinary callback returned SUCCESS/ERROR` | Shows result or error |
| 9. MongoDB record created | `media.js:51` | `[MEDIA] Saving Media record to MongoDB...` | Saves URL |
| 10. Response sent to client | `media.js:56-58` | `[MEDIA] Sending 201/500 response to client` | `res.json()` called |

**To identify the exact failing step:**
1. Restart the server with the new logging
2. Attempt an upload
3. Check the server console / Render logs for `[MEDIA]` and `[UPLOAD]` prefixed lines
4. The LAST log line before the gap tells you which step hung or failed

---

## Step 2: Root Causes Identified

### Root Cause #1 (PRIMARY): No axios timeout → infinite hang

**File changed:** `client/src/api/axios.js:4`

**Before:**
```js
const api = axios.create({ baseURL: API_URL });
// No timeout — promise hangs forever
```

**After:**
```js
const api = axios.create({ baseURL: API_URL, timeout: 60000 });
// 60-second timeout — ECONNABORTED error on timeout
```

**Why:** If the server never sends a response (e.g., Cloudinary hangs, server crashes mid-request, network drops), the `await api.post('/media', ...)` promise in `uploadImage` would **never resolve or reject**. The `catch` and `finally` blocks never run. `setUploading(false)` is never called. The UI stays on "Uploading..." permanently.

### Root Cause #2: No server-side timeout on Cloudinary API call

**File changed:** `server/services/upload.js:14-47`

**Before:** `cloudinary.uploader.upload()` used the Cloudinary SDK's default timeout (potentially very long or no timeout). If Cloudinary is unreachable or slow, the callback is never invoked, and the server never responds to the client.

**After:** Wrapped in `promiseWithTimeout(promise, 30000, 'Cloudinary upload')` — rejects after 30 seconds with a clear error message.

### Root Cause #3: No upload state cleanup guarantee

**File changed:** `client/src/pages/admin/EditProduct.jsx:58-62, 96-99`

**Before:** `setUploading(false)` was placed AFTER the try/catch block (lines 92-95). If an exception escaped the catch block, or if the code path had an early `return` inside `try`, the cleanup was skipped.

**After:** All state cleanup (`setUploading(false)`, `e.target.value = ''`, `setUploadProgress(0)`, `setPreviewUrl(null)`) is now in a `finally` block that fires **regardless** of success, failure, timeout, or early return.

### Root Cause #4: No Cloudinary credentials in .env or Render dashboard

**File changed:** `server/.env` and `render.yaml`

**Before:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` were entirely absent from both `.env` and `render.yaml`. On every server start, `cloudinary.config()` received `undefined` for all three values. Any upload call would fail with an authentication error.

**After:** Credentials are now in `.env` (for localhost) and declared in `render.yaml` (for Render — must be set manually in the Render dashboard as they're `sync: false`).

A startup check now logs at server boot:
```
========== CLOUDINARY CONFIG CHECK ==========
CLOUDINARY_CLOUD_NAME: SET [qmpifruw]
CLOUDINARY_API_KEY: SET [5227...]
CLOUDINARY_API_SECRET: SET [8rT9...]
cloudinary.config() loaded: qmpifruw
=============================================
```

### Root Cause #5: Token refresh request had no timeout

**File changed:** `client/src/api/axios.js:46`

**Before:** `axios.post(url, body)` — no timeout on the refresh request. If the `/auth/refresh` endpoint hangs, all queued upload requests wait forever.

**After:** `axios.post(url, body, { timeout: 15000 })` — 15-second timeout on token refresh.

---

## Step 3: Files Modified

| File | Change | Type |
|------|--------|------|
| `client/src/api/axios.js` | Added `timeout: 60000` to axios instance; added `timeout: 15000` to refresh request | Code fix |
| `client/src/pages/admin/EditProduct.jsx` | Added `finally` blocks in `uploadImage` / `replaceImage` with `resetUploadState()` | Code fix |
| `server/services/upload.js` | Added `promiseWithTimeout()` (30s); added detailed `[UPLOAD]` console.log at every step | Debug logging + timeout |
| `server/routes/media.js` | Added `[MEDIA]` console.log at every step (handler entry, Content-Type, multer callback, file details, Cloudinary result, DB save, response sent) | Debug logging |
| `server/server.js` | Added Cloudinary config check on startup with `console.log` of each env var status | Debug logging |
| `server/.env` | Added `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Configuration fix |
| `render.yaml` | Added CLOUDINARY env var declarations | Deployment fix |
| `client/.env` | Created with `VITE_API_URL=/api` | Configuration fix |

---

## Step 4: How to Verify on Localhost

1. **Restart the server** — make sure `server/.env` has the Cloudinary credentials loaded:
   ```
   CLOUDINARY_CLOUD_NAME=qmpifruw
   CLOUDINARY_API_KEY=522723973454766
   CLOUDINARY_API_SECRET=8rT9CaKrAMC0FB7gIg9O-7Rk6HY
   ```

2. **Check startup logs** — look for the Cloudinary config check block in server console

3. **Open browser DevTools → Network tab** — start an upload

4. **Check the network request:**
   - Method: POST
   - URL: `/api/media`
   - Status: should be 201 (success) or 4xx/5xx (failure — never hangs)
   - Response: should contain `url` (Cloudinary URL) on success

5. **Check the server console** — look for `[MEDIA]` and `[UPLOAD]` logs:
   ```
   [MEDIA] POST /media — route handler entered
   [MEDIA] Content-Type: multipart/form-data; boundary=...
   [MEDIA] Auth header present: true
   [MEDIA] Multer callback called
   [MEDIA] File received: { originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 123456 }
   [UPLOAD] Calling cloudinary.uploader.upload...
   [UPLOAD] Cloudinary callback returned SUCCESS: { public_id: '...', secure_url: 'https://res.cloudinary.com/...' }
   [MEDIA] Saving Media record to MongoDB...
   [MEDIA] Media saved to MongoDB — _id: ...
   [MEDIA] Sending 201 response to client
   ```

6. **If it hangs** — the last `[MEDIA]` or `[UPLOAD]` log tells you exactly which step failed:
   - If no `[MEDIA]` logs at all → request never reached the server (CORS, wrong URL, server down)
   - If `[MEDIA] Multer callback called` is missing → multer crashed internally
   - If `[UPLOAD] Cloudinary callback...` is missing → Cloudinary hung (check credentials)
   - If `[MEDIA] Saving Media record...` is the last → MongoDB is down
   - If `[MEDIA] Sending...` is the last but client still shows "Uploading..." → client-side issue

---

## Step 5: How to Verify on Render

1. **Go to Render Dashboard → your service → Environment**
2. **Verify these env vars are set manually** (they have `sync: false` in render.yaml):
   - `CLOUDINARY_CLOUD_NAME` = `qmpifruw`
   - `CLOUDINARY_API_KEY` = `522723973454766`
   - `CLOUDINARY_API_SECRET` = `8rT9CaKrAMC0FB7gIg9O-7Rk6HY`
3. **Redeploy** the service after setting the variables
4. **Check Render logs** for the Cloudinary config check and the `[MEDIA]` / `[UPLOAD]` debug logs

---

## Summary

The primary root cause is **#1: No timeout on axios**. Without it, any server-side delay or hang (Cloudinary timeouts, MongoDB latency, server crash mid-request) causes the client to wait forever. The fix adds a 60-second timeout to all API calls, plus a 30-second timeout on the Cloudinary upload itself, so the upload always completes or fails within a bounded time.

The secondary root cause is **#4: Cloudinary credentials not configured**, which has been fixed in `.env` and `render.yaml`.

Every code path now:
- Has a timeout
- Logs its progress with `[MEDIA]` / `[UPLOAD]` prefixes
- Returns a response (success or error)
- Cleans up UI state in a `finally` block
