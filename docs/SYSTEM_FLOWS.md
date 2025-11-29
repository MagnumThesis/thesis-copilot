# System Flow Diagrams

## User Registration Flow Diagram

```
START
  │
  ▼
┌─────────────────────────────┐
│ User clicks "Sign Up"       │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Register Page Renders               │
│ - Full Name input                   │
│ - Email input                       │
│ - Password input (with strength)    │
│ - Confirm Password input            │
│ - Terms checkbox                    │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ User fills form             │
│ and clicks register         │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Frontend Validation                 │
│ ✓ All fields present?               │
│ ✓ Valid email format?               │
│ ✓ Passwords match?                  │
│ ✓ Password >= 8 chars?              │
│ ✓ Terms accepted?                   │
└─────────┬───────────────────────────┘
          │
          ├─ FAIL
          │  │
          │  ▼
          │ ┌────────────────┐
          │ │ Show Error:    │
          │ │ "Fill all..."  │
          │ └────────────────┘
          │  │
          │  └─→ RETURN
          │
          └─ PASS
             │
             ▼
┌─────────────────────────────────────┐
│ POST /api/auth/register             │
│ Body: { email, password, fullName } │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Backend Input Validation            │
│ ✓ Fields not empty?                 │
│ ✓ Email format valid?               │
│ ✓ Password >= 8 chars?              │
└─────────┬───────────────────────────┘
          │
          ├─ FAIL
          │  │
          │  ▼
          │ ┌────────────────────────┐
          │ │ Return 400 Error       │
          │ │ { error: message }     │
          │ └────────────────────────┘
          │  │
          │  └─→ Show to User
          │
          └─ PASS
             │
             ▼
┌──────────────────────────────────────┐
│ Call Supabase Auth.signUp()          │
│ - Create auth record                 │
│ - Hash password                      │
│ - Generate UUID                      │
└─────────┬──────────────────────────┘
          │
          ├─ EMAIL_EXISTS
          │  │
          │  ▼
          │ ┌────────────────────────┐
          │ │ Return 400 Error       │
          │ │ "Email already exists" │
          │ └────────────────────────┘
          │  │
          │  └─→ Show to User
          │
          └─ SUCCESS
             │
             ▼
┌──────────────────────────────────────┐
│ Create user_profiles row             │
│ - id = user UUID                     │
│ - email                              │
│ - full_name                          │
│ - created_at = NOW()                 │
│ - updated_at = NOW()                 │
└─────────┬──────────────────────────┘
          │
          ├─ FAIL
          │  │
          │  ▼
          │ ┌────────────────────────┐
          │ │ Delete auth user       │
          │ │ Return 500 Error       │
          │ └────────────────────────┘
          │  │
          │  └─→ Show to User
          │
          └─ SUCCESS
             │
             ▼
┌──────────────────────────────────────┐
│ Return 201 Response                  │
│ {                                    │
│   success: true,                     │
│   user: { id, email, fullName },     │
│   message: "Registration successful" │
│ }                                    │
└─────────┬──────────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│ Frontend Receives Success            │
│ Shows confirmation message           │
│ Redirects to /login (after 2 sec)    │
└─────────┬──────────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│ User sees Login page                 │
│ Ready to authenticate                │
└─────────┬──────────────────────────┘
          │
          ▼
END
```

## Login to App Access Flow

```
START
  │
  ▼
┌──────────────────────┐
│ User on login page   │
│ or needs to login    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ User enters credentials          │
│ - email                          │
│ - password                       │
│ Clicks "Sign In"                 │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ POST /api/auth/login             │
│ Body: { email, password }        │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend Authentication           │
│ Call Supabase Auth.signInWith    │
│ Password()                       │
└────────┬─────────────────────────┘
         │
         ├─ WRONG_PASSWORD
         │  │
         │  ▼
         │ ┌────────────────────────┐
         │ │ Return 401             │
         │ │ "Invalid credentials"  │
         │ └────────────────────────┘
         │  │
         │  └─→ Show Error to User
         │
         ├─ EMAIL_NOT_FOUND
         │  │
         │  ▼
         │ ┌────────────────────────┐
         │ │ Return 401             │
         │ │ "Invalid credentials"  │
         │ └────────────────────────┘
         │  │
         │  └─→ Show Error to User
         │
         └─ SUCCESS
            │
            ▼
┌──────────────────────────────────┐
│ Get user profile from database   │
│ SELECT * FROM user_profiles      │
│ WHERE id = user.id               │
└────────┬─────────────────────────┘
         │
         ├─ NOT_FOUND
         │  │
         │  ▼
         │ ┌────────────────────────┐
         │ │ Return 500             │
         │ │ "Profile not found"    │
         │ └────────────────────────┘
         │  │
         │  └─→ Show Error to User
         │
         └─ FOUND
            │
            ▼
┌──────────────────────────────────┐
│ Return 200 Response              │
│ {                                │
│   success: true,                 │
│   user: {                        │
│     id,                          │
│     email,                       │
│     fullName                     │
│   },                             │
│   session: {                     │
│     accessToken (JWT),           │
│     refreshToken,                │
│     expiresIn: 3600,             │
│     expiresAt: timestamp         │
│   }                              │
│ }                                │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Frontend saves to localStorage   │
│ authState = {                    │
│   user,                          │
│   session,                       │
│   isLoading: false,              │
│   error: null                    │
│ }                                │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Update useAuth state             │
│ Set: user, session               │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Navigate to /app                 │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ ProtectedRoute checks:           │
│ - Is there a user in state?      │
│ - Is there a valid session?      │
└────────┬─────────────────────────┘
         │
         ├─ NO
         │  │
         │  ▼
         │ Redirect to /login
         │
         └─ YES
            │
            ▼
┌──────────────────────────────────┐
│ Verify token with backend        │
│ POST /api/auth/verify            │
│ Authorization: Bearer <token>    │
└────────┬─────────────────────────┘
         │
         ├─ INVALID/EXPIRED
         │  │
         │  ▼
         │ Try refresh token
         │ POST /api/auth/refresh
         │
         │  ├─ REFRESH_FAILED
         │  │  │
         │  │  ▼
         │  │ Redirect to /login
         │  │ Clear localStorage
         │  │
         │  └─ REFRESH_SUCCESS
         │     │
         │     ▼
         │    Update tokens
         │    Continue
         │
         └─ VALID
            │
            ▼
┌──────────────────────────────────┐
│ Render Main App Page             │
│ /app/                            │
│ - Sidebar with chats             │
│ - Chat area                      │
│ - Tools panel                    │
│ - Full access granted            │
└────────┬─────────────────────────┘
         │
         ▼
END (User is authenticated)
```

## Token Refresh Flow

```
START (Access Token Expired)
  │
  ▼
┌───────────────────────────────┐
│ Frontend makes API request    │
│ with expired accessToken      │
└────────┬──────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│ Backend receives request      │
│ Verifies token               │
└────────┬──────────────────────┘
         │
         ├─ TOKEN_EXPIRED
         │  │
         │  ▼
         │ ┌──────────────────────┐
         │ │ Return 401           │
         │ │ Unauthorized         │
         │ └──────────────────────┘
         │  │
         │  └─→ Frontend sees 401
         │     │
         │     ▼
         │  ┌──────────────────────┐
         │  │ Has refreshToken?    │
         │  └────┬─────────────────┘
         │       │
         │       ├─ NO
         │       │  │
         │       │  ▼
         │       │ Redirect to /login
         │       │ Clear localStorage
         │       │
         │       └─ YES
         │          │
         │          ▼
         │       POST /api/auth/refresh
         │       Body: { refreshToken }
         │          │
         │          ▼
         │       ┌─────────────────────┐
         │       │ Backend validates   │
         │       │ refresh token       │
         │       └────┬────────────────┘
         │            │
         │            ├─ INVALID/EXPIRED
         │            │  │
         │            │  ▼
         │            │ Return 401
         │            │ Redirect to /login
         │            │ Clear localStorage
         │            │
         │            └─ VALID
         │               │
         │               ▼
         │            ┌──────────────────────┐
         │            │ Generate new tokens: │
         │            │ - New accessToken    │
         │            │ - New refreshToken   │
         │            └────┬─────────────────┘
         │                 │
         │                 ▼
         │            ┌──────────────────────┐
         │            │ Return 200           │
         │            │ {                    │
         │            │   accessToken (new), │
         │            │   refreshToken (new),│
         │            │   expiresIn: 3600    │
         │            │ }                    │
         │            └────┬─────────────────┘
         │                 │
         │                 ▼
         │            ┌──────────────────────┐
         │            │ Frontend updates     │
         │            │ localStorage with    │
         │            │ new tokens           │
         │            └────┬─────────────────┘
         │                 │
         │                 ▼
         │            ┌──────────────────────┐
         │            │ Retry original       │
         │            │ request with         │
         │            │ new accessToken      │
         │            └────┬─────────────────┘
         │                 │
         │                 ▼
         │            Request succeeds ✓
         │
         └─ TOKEN_VALID
            │
            ▼
       Request proceeds normally
         │
         ▼
END
```

---

These diagrams show:
- ✅ Complete registration flow
- ✅ Complete login flow
- ✅ Token refresh mechanism
- ✅ Error handling at each step
- ✅ State management updates
- ✅ Storage operations
