# Student Management System

A production-ready full-stack student management system built with React.js, Node.js, Express, and PostgreSQL.

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React.js, React Router, Axios, Tailwind CSS, RHF    |
| Backend   | Node.js, Express.js, express-validator              |
| Database  | PostgreSQL                                          |
| Auth      | JWT, bcryptjs                                       |
| Security  | Helmet, CORS, input validation, SQL injection safe  |

---

## Project Structure

```
student-management-system/
├── database/
│   └── schema.sql              # PostgreSQL schema + seed data
├── backend/
│   ├── config/
│   │   └── db.js               # PostgreSQL pool connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── studentController.js
│   ├── middlewares/
│   │   ├── auth.js             # JWT middleware
│   │   ├── validate.js         # express-validator rules
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   ├── userModel.js
│   │   └── studentModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── studentRoutes.js
│   ├── utils/
│   │   └── hashPassword.js
│   ├── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/         # Reusable UI components
    │   ├── context/            # Auth context
    │   ├── hooks/              # Custom hooks
    │   ├── layouts/            # Page layouts
    │   ├── pages/              # Route pages
    │   ├── services/           # API service layer
    │   └── utils/              # Helpers & constants
    ├── .env
    └── package.json
```

---

## Quick Start

### 1. PostgreSQL Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE student_management;"

# Run schema (creates tables + seed data)
psql -U postgres -d student_management -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env     # Fill in your DB credentials + JWT secret
npm install
npm run dev              # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start                # Starts on http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable        | Description                    | Example                  |
|-----------------|--------------------------------|--------------------------|
| PORT            | Server port                    | 5000                     |
| DB_HOST         | PostgreSQL host                | localhost                |
| DB_PORT         | PostgreSQL port                | 5432                     |
| DB_NAME         | Database name                  | student_management       |
| DB_USER         | Database user                  | postgres                 |
| DB_PASSWORD     | Database password              | your_password            |
| JWT_SECRET      | Secret for signing JWTs        | long_random_string       |
| JWT_EXPIRES_IN  | Token expiry                   | 7d                       |
| CLIENT_URL      | Allowed CORS origin            | http://localhost:3000    |

### Frontend (`frontend/.env`)

| Variable             | Description        | Example                        |
|----------------------|--------------------|--------------------------------|
| REACT_APP_API_URL    | Backend API URL    | http://localhost:5000/api      |

---

## Default Admin Credentials

```
Email:    admin@sms.com
Password: Admin@123
```

> To change the admin password, run:
> ```bash
> node backend/utils/hashPassword.js "YourNewPassword"
> ```
> Then update the hash in the `users` table.

---

## API Documentation

### Authentication

#### POST /api/auth/login
```json
Request:  { "email": "admin@sms.com", "password": "Admin@123" }
Response: { "token": "<jwt>", "user": { "id", "name", "email", "role" } }
```

---

### Students  *(All require `Authorization: Bearer <token>`)*

#### GET /api/students
Query params: `search`, `status`, `course`, `page`, `limit`, `sortBy`, `sortOrder`

```json
Response: {
  "data": [...],
  "pagination": { "total": 5, "page": 1, "limit": 10, "pages": 1 }
}
```

#### GET /api/students/stats
```json
Response: { "total": "5", "active": "4", "new_this_month": "2" }
```

#### GET /api/students/:id
```json
Response: { student object }
```

#### POST /api/students
```json
Request: {
  "first_name": "Alice", "last_name": "Johnson",
  "email": "alice@example.com", "phone": "555-0101",
  "date_of_birth": "2000-03-15", "gender": "Female",
  "address": "123 Main St", "course": "Computer Science",
  "enrollment_date": "2024-01-10", "status": "Active"
}
```

#### PUT /api/students/:id
Same body as POST.

#### DELETE /api/students/:id
Soft delete — sets `deleted_at` timestamp.

---

## Features

- JWT authentication with protected routes
- Full CRUD for student records
- Auto-generated Student IDs (STU-YYYY####)
- Soft delete (records preserved in DB)
- Search, filter by status/course, pagination, multi-column sorting
- Dashboard with live statistics
- Responsive mobile-friendly UI
- Toast notifications for all actions
- Form validation (frontend + backend)
- Password hashing with bcrypt
- SQL injection protection via parameterized queries
- Helmet + CORS security headers

---

## Future Enhancements

- Role-based access control (admin vs. viewer)
- Export students to CSV / PDF
- Student photo upload (S3)
- Email notifications on enrollment
- Academic grade tracking
- Bulk import via CSV
- Dark mode
- Audit log / change history
