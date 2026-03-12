# Course Registration System

A full-stack web application for managing course registration, built with Angular 20 and Express.js, backed by MySQL on AWS RDS.

## Team

Team 3 — INFO Course Project

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20 |
| Backend | Node.js, Express.js |
| Database | MySQL (AWS RDS) |
| Auth | JWT + bcrypt |

## Features

- **Student**: Browse available course sessions, enroll in or drop courses, view current schedule
- **Instructor**: View assigned sessions and enrolled student rosters
- **Admin**: View all enrollments across the system
- Role-based access control enforced on both frontend (route guards) and backend (middleware)

## Project Structure

```
team3-course-registration/
├── cr-backend/          # Express.js API server
│   ├── server.js
│   ├── db.js
│   ├── auth.routes.js
│   ├── auth.middleware.js
│   ├── course.routes.js
│   ├── enrollment.routes.js
│   ├── instructor.routes.js
│   └── .env.example     # Copy to .env and fill in your values
└── cr-frontend/         # Angular 20 application
    └── src/app/
        ├── course.service.ts
        ├── auth.interceptor.ts
        └── instructor.guard.ts
```

## Getting Started

See [SETUP.md](SETUP.md) for full setup and deployment instructions.

### Quick Start

```bash
# Backend
cd cr-backend
cp .env.example .env      # Fill in your database and JWT values
npm install
node server.js

# Frontend (separate terminal)
cd cr-frontend
npm install
npm start
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8085`

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/verify` | Public | Verify JWT token |
| GET | `/api/courses` | Public | List all courses |
| GET | `/api/courses/sessions` | Public | List all course sessions |
| GET | `/api/enrollments/my` | Student | Get current student's enrollments |
| POST | `/api/enrollments` | Student | Enroll in a session |
| DELETE | `/api/enrollments/:sessionId` | Student | Drop a session |
| GET | `/api/enrollments` | Admin | Get all enrollments |
| GET | `/api/instructor/sessions` | Instructor | Get assigned sessions |
| GET | `/api/instructor/sessions/:id/students` | Instructor | Get session roster |
| GET | `/api/health` | Public | Server health check |

## Security Notes

- Never commit `.env` — it is listed in `.gitignore`
- Use a strong, randomly generated `JWT_SECRET` in production (`openssl rand -hex 64`)
- Enable HTTPS in production before deploying
- Rotate any credentials that were previously exposed in version control
