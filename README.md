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
