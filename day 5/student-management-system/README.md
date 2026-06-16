# Student Management System

A full-stack student management system built with React, Node.js, Express, and PostgreSQL.

## Features

- Admin authentication with JWT
- Student CRUD operations
- Dashboard with statistics
- Search, filter, sort, and pagination
- Responsive modern UI
- Soft delete functionality

## Tech Stack

**Frontend:** React 18, React Router 6, Axios, Tailwind CSS, React Hook Form
**Backend:** Node.js, Express.js, PostgreSQL (Neon)
**Auth:** JWT, bcryptjs

## Project Structure

```
student-management/
├── backend/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/     # Auth & error handling
│   │   ├── models/         # Database models
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── validators/     # Zod validation schemas
│   │   ├── utils/          # Helper functions
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   └── sql/                # Database schema
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # React context
│   │   ├── utils/          # Helpers
│   │   └── App.jsx         # Routes
│   └── ...
└── README.md
```

## Installation

### Prerequisites

- Node.js >= 18
- PostgreSQL database (Neon)

### Setup

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Database Setup

The schema auto-runs when the server starts. Alternatively, run:
```bash
psql -d your_database -f backend/sql/schema.sql
```

### Environment Variables

Backend (`backend/.env`):
```
PORT=5000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@school.com
ADMIN_PASSWORD=Admin@123456
```

Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:5000
```

### Run

Start backend:
```bash
cd backend
npm run dev
```

Start frontend:
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 and login with `admin@school.com` / `Admin@123456`.

## API Documentation

### Authentication

| Method | Endpoint           | Description      |
|--------|--------------------|------------------|
| POST   | /api/auth/login    | Admin login      |
| GET    | /api/auth/profile  | Get user profile |

### Students (Protected)

| Method | Endpoint               | Description         |
|--------|------------------------|---------------------|
| GET    | /api/students          | List with pagination|
| GET    | /api/students/stats    | Dashboard stats     |
| GET    | /api/students/:id      | Get single student  |
| POST   | /api/students          | Create student      |
| PUT    | /api/students/:id      | Update student      |
| DELETE | /api/students/:id      | Soft delete student |

### Query Parameters (GET /api/students)

- `search` - Search by name, email, course
- `status` - Filter by Active/Inactive
- `sortBy` - Sort column
- `sortOrder` - ASC or DESC
- `page` - Page number
- `limit` - Items per page (max 100)

## Security

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Zod input validation
- SQL injection protection via parameterized queries
- Helmet security headers
- CORS configuration
- Rate limiting

## License

MIT


## 