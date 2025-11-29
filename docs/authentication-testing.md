# Authentication Testing Guide

## Manual Testing with Postman

### Setup Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new collection called "Thesis Copilot Auth"
3. Create a new environment with these variables:

```
base_url: http://localhost:8787/api/auth
access_token: (will be filled after login)
refresh_token: (will be filled after login)
user_id: (will be filled after registration)
test_email: test-{{$randomInt}}-{{$timestamp}}@example.com
test_password: TestPassword123
```

### Test Cases

#### 1. Register New User

**Request**:
```
POST {{base_url}}/register
Content-Type: application/json

{
  "email": "{{test_email}}",
  "password": "{{test_password}}",
  "fullName": "Test User"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test-xxx@example.com",
    "fullName": "Test User"
  },
  "message": "Registration successful..."
}
```

**Save**: Copy the `user.id` to `user_id` environment variable

---

#### 2. Login

**Request**:
```
POST {{base_url}}/login
Content-Type: application/json

{
  "email": "{{test_email}}",
  "password": "{{test_password}}"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test-xxx@example.com",
    "fullName": "Test User"
  },
  "session": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "expiresAt": 1234567890
  }
}
```

**Save**: 
- Copy `session.accessToken` to `access_token` environment variable
- Copy `session.refreshToken` to `refresh_token` environment variable

---

#### 3. Verify Token

**Request**:
```
POST {{base_url}}/verify
Authorization: Bearer {{access_token}}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test-xxx@example.com",
    "fullName": "Test User"
  }
}
```

---

#### 4. Get User Profile

**Request**:
```
GET {{base_url}}/profile/{{user_id}}
Authorization: Bearer {{access_token}}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test-xxx@example.com",
    "fullName": "Test User",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 5. Update User Profile

**Request**:
```
PUT {{base_url}}/profile/{{user_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "fullName": "Updated User Name"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test-xxx@example.com",
    "fullName": "Updated User Name",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

---

#### 6. Refresh Session

**Request**:
```
POST {{base_url}}/refresh
Content-Type: application/json

{
  "refreshToken": "{{refresh_token}}"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "session": {
    "accessToken": "new_eyJhbGc...",
    "refreshToken": "new_eyJhbGc...",
    "expiresIn": 3600,
    "expiresAt": 1234567890
  }
}
```

**Save**: Copy new `accessToken` to `access_token` environment variable

---

#### 7. Change Password

**Request**:
```
POST {{base_url}}/change-password/{{user_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "newPassword": "NewPassword456"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

#### 8. Logout

**Request**:
```
POST {{base_url}}/logout
Authorization: Bearer {{access_token}}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Error Testing

### Test Missing Fields

**Request**:
```
POST {{base_url}}/register
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

---

### Test Invalid Email

**Request**:
```
POST {{base_url}}/register
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "TestPassword123",
  "fullName": "Test User"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

---

### Test Weak Password

**Request**:
```
POST {{base_url}}/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "short",
  "fullName": "Test User"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "error": "Password must be at least 8 characters long"
}
```

---

### Test Invalid Credentials

**Request**:
```
POST {{base_url}}/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "WrongPassword123"
}
```

**Expected Response** (401):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### Test Invalid Token

**Request**:
```
POST {{base_url}}/verify
Authorization: Bearer invalid-token-here
```

**Expected Response** (401):
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

---

## Browser Testing

### Registration Flow

1. Open http://localhost:5173
2. Click "Sign Up"
3. Enter:
   - Full Name: John Doe
   - Email: test@example.com
   - Password: TestPassword123
   - Confirm Password: TestPassword123
   - Check "I agree to Terms"
4. Click "Create Account"
5. Should see success message
6. Should be redirected to login page

### Login Flow

1. On login page, enter:
   - Email: test@example.com
   - Password: TestPassword123
2. Click "Sign In"
3. Should be redirected to /app
4. Should see main application interface

### Protected Routes

1. While logged out, try accessing http://localhost:5173/app
2. Should be redirected to login page

2. While logged in, try accessing http://localhost:5173/
3. Should be redirected to /app

### Session Expiry

1. Log in
2. Open browser DevTools → Application → LocalStorage
3. Check `authState` is stored
4. Clear `authState` from localStorage
5. Refresh page
6. Should be redirected to login

## Performance Testing

### Load Testing Endpoints

Use a tool like Apache Bench or Artillery to test:

```bash
# Register 100 users
ab -n 100 -c 10 -p register.json http://localhost:8787/api/auth/register

# Login 100 times
ab -n 100 -c 10 -p login.json http://localhost:8787/api/auth/login
```

### Monitor Response Times

- Registration: < 500ms
- Login: < 500ms
- Token Verification: < 100ms
- Profile Retrieval: < 200ms

## Security Testing

### Test Password Validation

- ✅ Empty password should fail
- ✅ Passwords < 8 chars should fail
- ✅ Password mismatch should fail
- ✅ Strong passwords should pass

### Test Token Expiration

- ✅ Expired token should return 401
- ✅ Invalid token format should return 401
- ✅ Missing token should return 401

### Test CORS

- ✅ Cross-origin requests should work with valid origin
- ✅ Invalid origin should be blocked

### Test Input Validation

- ✅ SQL injection attempts should be sanitized
- ✅ XSS attempts should be sanitized
- ✅ Extra whitespace should be trimmed

## Checklist

- [ ] Registration works with valid data
- [ ] Registration fails with invalid data
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Token verification works
- [ ] User profile can be retrieved
- [ ] User profile can be updated
- [ ] Session can be refreshed
- [ ] Password can be changed
- [ ] Logout works
- [ ] Protected routes redirect properly
- [ ] Error messages are user-friendly
- [ ] Response times are acceptable
- [ ] CORS is properly configured
- [ ] Security validations work

## Debugging

### Enable Debug Logging

1. In `src/worker/index.ts`, debug logs are enabled by default
2. Check server terminal for detailed request/response logs

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "auth" to see all auth API calls
4. Check Response tab for detailed error messages
5. Check Console tab for JavaScript errors

### Check LocalStorage

1. DevTools → Application → LocalStorage
2. Should see `authState` with user info and tokens
3. Check that tokens are valid JSON

## Test Report Template

```
Date: _______________
Tester: _______________
Environment: Development | Staging | Production

PASS/FAIL Test Cases:
- Registration: ______
- Login: ______
- Token Verification: ______
- Profile Management: ______
- Session Refresh: ______
- Logout: ______
- Error Handling: ______
- Security: ______

Issues Found:
1. _______________
2. _______________

Recommendations:
1. _______________
2. _______________

Sign-off: _______ Date: _______
```

## Continuous Testing

### Automated Tests (Recommended)

```bash
# Run test suite
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### GitHub Actions

Set up CI/CD pipeline to automatically test on push:

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run check
```

---

**All tests passing? Great!** Your authentication system is ready for production.
