# Course Registration System - Setup Guide

This guide explains how to run the frontend and backend together.

## Architecture Overview

- **Frontend**: Angular 20 application running on `http://localhost:8080`
- **Backend**: Express.js API server running on `http://localhost:8085`
- **Database**: MySQL (AWS RDS)

## Prerequisites

- Node.js v22.21.1 or later
- npm v10.9.4 or later
- MySQL database access (or configure local MySQL)

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd cr-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

The `.env` file is already configured with the following settings:

```env
# Server Configuration
PORT=8085

# Database Configuration
DB_HOST=course-reg-db.cl8ges04uou6.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=Class2025!
DB_NAME=course_registration

# CORS Configuration
FRONTEND_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=dev_secret_key
JWT_EXPIRES_IN=24h
```

**Note**: If you need to use a different database, update the `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` values.

### 4. Start the Backend Server
```bash
node server.js
```

Expected output:
```
🚀 Server running on port 8085
✅ Connected to MySQL database
```

**Note**: If you see a database connection error, this is expected if the AWS RDS instance is not accessible from your network. The server will still start and you can test with mock data.

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd cr-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm start
```

Or alternatively:
```bash
ng serve
```

Expected output:
```
Application bundle generation complete.
Local: http://localhost:8080/
```

## Running Both Together

### Option 1: Two Terminal Windows

**Terminal 1 - Backend:**
```bash
cd cr-backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd cr-frontend
npm start
```

### Option 2: Using npm scripts (if configured)

You can add scripts to the root `package.json` to run both concurrently.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Courses
- `GET /api/courses` - Get all courses

### Enrollments
- `GET /api/enrollments` - Get all enrollments

### Instructor
- `GET /api/instructor/sessions` - Get instructor's sessions (requires authentication)
- `GET /api/instructor/sessions/:sessionId/students` - Get students for a session (requires authentication)

### Health Check
- `GET /api/health` - Server health check

## Frontend-Backend Integration

### Authentication Flow

1. User enters credentials on login page (`http://localhost:8080/login`)
2. Frontend sends POST request to `http://localhost:8085/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. All subsequent API requests include JWT token in Authorization header
6. Backend validates token using auth middleware

### HTTP Interceptor

The frontend includes an HTTP interceptor (`auth.interceptor.ts`) that automatically adds the JWT token to all outgoing requests:

```typescript
Authorization: Bearer <token>
```

### API Service Integration

The `CourseService` has been updated to call backend APIs with fallback to mock data:

```typescript
// Example: Fetching courses
getCourses(): Observable<Course[]> {
  return this.http.get<Course[]>('http://localhost:8085/api/courses')
    .pipe(
      catchError(() => {
        // Falls back to mock data if backend is unavailable
        return of(mockCourses);
      })
    );
}
```

This allows the application to work even if the backend is temporarily unavailable.

## CORS Configuration

The backend is configured to accept requests from the frontend:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
```

## Testing the Connection

### 1. Check Backend Health
```bash
curl http://localhost:8085/api/health
```

Expected response:
```json
{"ok":true}
```

### 2. Check Frontend Access
Open browser to `http://localhost:8080`

### 3. Test Login Flow
1. Navigate to `http://localhost:8080/login`
2. Enter test credentials (if you have test users in database)
3. Check browser console for network requests to backend
4. Verify JWT token is stored in localStorage

## Troubleshooting

### Backend Issues

**Port already in use:**
```
Error: listen EADDRINUSE: address already in use :::8085
```
Solution: Change PORT in `.env` or kill the process using port 8085:
```bash
lsof -ti:8085 | xargs kill
```

**Database connection failed:**
```
❌ Database connection failed: getaddrinfo EAI_AGAIN
```
Solution: This is expected if AWS RDS is not accessible. The server will still work with mock data or you can configure a local MySQL instance.

### Frontend Issues

**Port 8080 already in use:**
Solution: Angular will automatically use the next available port (8081, 8082, etc.)

**CORS errors in browser console:**
```
Access to XMLHttpRequest at 'http://localhost:8085/api/...' has been blocked by CORS policy
```
Solution: Ensure backend is running and CORS is properly configured in `server.js`.

**HTTP 401 Unauthorized:**
Solution: Check that JWT token is being sent in Authorization header. Clear localStorage and log in again.

## Development Tips

### Hot Reload
- Frontend: Automatically reloads on file changes (Angular dev server)
- Backend: Requires manual restart or use `nodemon`:
  ```bash
  npm install -g nodemon
  nodemon server.js
  ```

### Browser DevTools
- Check Network tab for API requests
- Check Console for error messages
- Check Application > Local Storage for stored tokens

### API Testing
Use Postman or curl to test backend endpoints:

```bash
# Login
curl -X POST http://localhost:8085/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"your-password"}'

# Get courses (with authentication)
curl http://localhost:8085/api/courses \
  -H "Authorization: Bearer <your-token>"
```

## Next Steps

1. Set up proper database with test data
2. Implement remaining API endpoints (enrollment, course management)
3. Add error handling and loading states in frontend
4. Configure production environment variables
5. Set up deployment pipelines

## Security Notes

⚠️ **Development Only**: The current JWT_SECRET is for development only. Use a strong, random secret in production.

⚠️ **Password Requirements**: Minimum 12 characters required by backend validation.

⚠️ **HTTPS**: Use HTTPS in production for secure token transmission.
