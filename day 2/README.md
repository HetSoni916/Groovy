# ✅ Todo App

A production-quality full-stack Todo application built with **React.js** (frontend) and **Node.js + Express.js** (backend).

---

## Features

- **Add** todos with title and optional description
- **Edit** todos inline
- **Delete** todos with confirmation
- **Toggle** complete / incomplete
- **Filter** by All / Active / Completed
- **Search** todos by title or description
- Character limit validation (100 chars)
- Loading and error states
- Responsive, accessible UI

---

## Project Structure

```
todo-app/
├── backend/
│   ├── controllers/     # Request handlers (business logic)
│   ├── routes/          # Express route definitions
│   ├── models/          # In-memory data store
│   ├── middleware/       # Error handling middleware
│   └── app.js           # Express app entry point
└── frontend/
    ├── public/          # Static HTML shell
    └── src/
        ├── components/  # Reusable UI components
        ├── hooks/       # Custom React hooks (state logic)
        ├── services/    # API communication layer
        ├── App.jsx      # Root component
        └── App.css      # Global styles
```

---

## Installation & Setup

### Prerequisites

- Node.js >= 16
- npm >= 8

### 1. Clone / Download

```bash
cd todo-app
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Running the App

### Start Backend (runs on port 5000)

```bash
cd backend
npm run dev      # development (nodemon)
# or
npm start        # production
```

### Start Frontend (runs on port 3000)

```bash
cd frontend
npm start
```

Open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Endpoint       | Description        | Body                          |
|--------|----------------|--------------------|-------------------------------|
| GET    | `/todos`       | Fetch all todos    | —                             |
| POST   | `/todos`       | Create a todo      | `{ title, description? }`    |
| PUT    | `/todos/:id`   | Update a todo      | `{ title?, description?, completed? }` |
| DELETE | `/todos/:id`   | Delete a todo      | —                             |
| GET    | `/health`      | Health check       | —                             |

### Response Format

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Tech Stack

| Layer     | Technology                   |
|-----------|------------------------------|
| Frontend  | React 18, React Hooks        |
| Backend   | Node.js, Express 4           |
| Storage   | In-memory (array)            |
| Styling   | Pure CSS (custom properties) |
| IDs       | UUID v4                      |

---

## Future Improvements

- [ ] Persist data with MongoDB or PostgreSQL
- [ ] User authentication (JWT)
- [ ] Due dates and priority levels
- [ ] Drag-and-drop reordering
- [ ] Dark mode toggle
- [ ] Unit and integration tests (Jest, React Testing Library)
- [ ] Docker + docker-compose setup
- [ ] Deploy to AWS (ECS + RDS or Elastic Beanstalk)


## Prompt

Build a production-quality Todo Application using React.js for the frontend and Node.js + Express.js for the backend.

Requirements:

Frontend:

Use React functional components and hooks.
Create a clean, modern, and responsive UI.
Include:
Add Todo
Edit Todo
Delete Todo
Mark Todo as Complete/Incomplete
Filter Todos (All, Active, Completed)
Search Todos
Display loading and error states.
Use proper folder structure.
Use reusable components.
Add form validation.

Backend:

Use Node.js and Express.js.
Create REST APIs:
GET /todos
POST /todos
PUT /todos/
DELETE /todos/
Use in-memory storage initially (no database required).
Add proper error handling.
Follow MVC structure.

Code Quality:

Use clean and readable code.
Add comments where necessary.
Follow industry best practices.
Use async/await.
Use meaningful variable and function names.
Avoid code duplication.

Project Structure:

Provide complete frontend and backend folder structure.
Generate all necessary files.
Explain the purpose of each folder.

Documentation:

Create a professional README.md containing:
Project Overview
Features
Installation Steps
Running Frontend
Running Backend
API Endpoints
Future Improvements

Output Requirements:

First provide the complete project architecture.
Then generate backend code file by file.
Then generate frontend code file by file.
Finally provide setup instructions and testing steps.