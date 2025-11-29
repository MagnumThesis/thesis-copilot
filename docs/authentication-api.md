# Authentication API Reference

## Base URL

Development: `http://localhost:8787/api/auth`
Production: `https://your-worker-url.workers.dev/api/auth`

## Authentication Methods

All protected endpoints require an `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Register

Create a new user account.

**Endpoint**: `POST /register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "message": "Registration successful. Please check your email for confirmation."
}
```

**Error Responses**:
- 400: Missing required fields
- 400: Invalid email format
- 400: Password must be at least 8 characters long
- 400: Email already exists

---

### Login

Authenticate a user and receive session tokens.

**Endpoint**: `POST /login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "session": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600,
    "expiresAt": 1234567890
  }
}
```

**Error Responses**:
- 400: Email and password are required
- 401: Invalid email or password

---

### Verify Token

Verify the validity of a JWT token.

**Endpoint**: `POST /verify`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Error Responses**:
- 400: Authorization header is required
- 401: Invalid or expired token

---

### Refresh Session

Get a new access token using a refresh token.

**Endpoint**: `POST /refresh`

**Request**:
```json
{
  "refreshToken": "refresh_token"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "session": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 3600,
    "expiresAt": 1234567890
  }
}
```

**Error Responses**:
- 400: Refresh token is required
- 401: Invalid or expired refresh token

---

### Logout

Logout the current user and invalidate their session.

**Endpoint**: `POST /logout`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses**:
- 400: Authorization header is required
- 400: Logout failed

---

### Get User Profile

Retrieve user profile information.

**Endpoint**: `GET /profile/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 400: User ID is required
- 401: Authentication required
- 404: User not found

---

### Update User Profile

Update user profile information.

**Endpoint**: `PUT /profile/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "fullName": "Jane Doe"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

**Error Responses**:
- 400: User ID is required
- 401: Authentication required
- 400: Failed to update profile

---

### Change Password

Change the user's password.

**Endpoint**: `POST /change-password/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "newPassword": "NewSecurePassword456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:
- 400: User ID and new password are required
- 400: Password must be at least 8 characters long
- 401: Authentication required
- 400: Failed to change password

---

### Request Password Reset

Request a password reset email.

**Endpoint**: `POST /forgot-password`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Error Responses**:
- 400: Email is required
- 400: User not found
- 400: Failed to request password reset

---

### Reset Password

Reset password using a token (received via email).

**Endpoint**: `POST /reset-password`

**Headers**:
```
Authorization: Bearer <reset_token>
Content-Type: application/json
```

**Request**:
```json
{
  "newPassword": "NewSecurePassword456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses**:
- 400: Authorization header and new password are required
- 401: Invalid or expired reset token
- 400: Failed to reset password

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

- Registration: 5 attempts per hour per IP
- Login: 10 attempts per hour per IP
- Password reset: 3 attempts per hour per email

(Rate limiting not yet implemented - to be added in future versions)

## Token Expiration

- Access Token: 3600 seconds (1 hour)
- Refresh Token: 604800 seconds (7 days)

## CORS Configuration

The API accepts requests from:
- `http://localhost:3000`
- `http://localhost:5173`
- Production domain (configure in deployment)

## Examples

### cURL

**Register**:
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "fullName": "John Doe"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

**Verify Token**:
```bash
curl -X POST http://localhost:8787/api/auth/verify \
  -H "Authorization: Bearer <access_token>"
```

### JavaScript/Fetch

**Register**:
```javascript
const response = await fetch('http://localhost:8787/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123',
    fullName: 'John Doe'
  })
});
const data = await response.json();
```

**Login**:
```javascript
const response = await fetch('http://localhost:8787/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123'
  })
});
const data = await response.json();
// Store tokens in localStorage
localStorage.setItem('authState', JSON.stringify(data));
```

### Python/Requests

**Register**:
```python
import requests

response = requests.post(
    'http://localhost:8787/api/auth/register',
    json={
        'email': 'user@example.com',
        'password': 'SecurePassword123',
        'fullName': 'John Doe'
    }
)
data = response.json()
```

## Security Notes

1. Always use HTTPS in production
2. Never store plain passwords
3. Tokens should be stored securely (httpOnly cookies recommended)
4. Validate all input on both client and server
5. Implement rate limiting on production
6. Use strong password requirements
7. Rotate tokens regularly
8. Implement CSRF protection
9. Use secure session handling
10. Log all authentication events for auditing
