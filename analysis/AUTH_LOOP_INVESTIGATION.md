# Authentication Loop Investigation Report

## Problem Description
The user reported an infinite loop issue on iOS devices, characterized by repeated `POST` requests to the Supabase `token?grant_type=refresh_token` endpoint. These requests fail with `429 (Too Many Requests)` and `400 (Bad Request)` errors.

## Investigation Findings

### 1. Root Cause: `autoRefreshToken` Configuration
The primary cause of the loop is identified in `src/lib/supabase/client.ts`.

```typescript
// src/lib/supabase/client.ts

clientInstance = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Disable automatic token refresh to prevent SIGNED_IN spam
      autoRefreshToken: true, // <--- PROBLEM HERE
      persistSession: true,
      // Don't detect session from URL (prevents re-auth on visibility)
      detectSessionInUrl: false,
    }
  }
)
```

The code comment explicitly states intention to **"Disable automatic token refresh"**, but the configuration is set to `true`.

When `autoRefreshToken` is `true`, the Supabase client automatically sets up a timer to refresh the token. If the refresh fails (e.g., due to network issues, invalid token, or race conditions), the client may retry. In some scenarios (like waking up a tab on iOS), this can lead to a rapid retry loop, triggering the `429 Too Many Requests` error.

### 2. Middleware Conflict
The middleware (`src/lib/supabase/middleware.ts`) is configured to clear auth cookies if `getUser()` fails:

```typescript
    if (error && error.message !== 'Auth session missing!') {
      // ...
      authCookies.forEach(cookie => {
        response.cookies.delete(cookie.name);
      });
    }
```

If the middleware clears the cookies, but the client-side Supabase instance still holds a stale session in memory (or local storage), the client might try to refresh the token. Since the cookies are gone or invalid, the refresh fails. If `autoRefreshToken` is on, it keeps retrying, causing the loop.

### 3. Header & Tab Switching
The user mentioned issues with Header authorization and tab switching.
- **Header**: The `Header.tsx` component correctly uses `useAuth` and does not appear to trigger any auth logic itself.
- **Tab Switching**: When switching tabs, browsers often wake up suspended pages. If `autoRefreshToken` is on, the client immediately tries to refresh the token. If multiple tabs do this simultaneously, they can invalidate each other's refresh tokens (Refresh Token Rotation), leading to `400 Bad Request` errors. The client then retries, leading to the loop.

## Recommendations

### Immediate Fix
1.  **Disable `autoRefreshToken`**: Change `autoRefreshToken: true` to `false` in `src/lib/supabase/client.ts`. This aligns the code with the comment and prevents the background retry loop.

### Long-term Improvements
1.  **Session Management**: Rely on `AuthContext` to handle session validation on mount (which it already does via `fetchSession`).
2.  **Error Handling**: Ensure that if `fetchSession` encounters a `400` or `429` error, it signs the user out cleanly instead of retrying.

## Next Steps
I will apply the fix to `src/lib/supabase/client.ts` to stop the loop.
