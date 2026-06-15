import React, { useState } from "react";
import TodoForm from "./TodoForm";

const TodoItem = ({ todo, onUpdate, onDelete, onToggle }) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (title, description) => {
    await onUpdate(todo.id, { title, description });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(todo.id);
    } catch {
      setDeleting(false);
    }
  };

  const formattedDate = new Date(todo.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (editing) {
    return (
      <li className="todo-item editing">
        <TodoForm
          initialData={todo}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`todo-item ${todo.completed ? "completed" : ""} ${deleting ? "deleting" : ""}`}>
      <button
        className="toggle-btn"
        onClick={() => onToggle(todo.id, todo.completed)}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
        title={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        <span className="checkmark">{todo.completed ? "✓" : ""}</span>
      </button>

      <div className="todo-content">
        <span className="todo-title">{todo.title}</span>
        {todo.description && <span className="todo-description">{todo.description}</span>}
        <span className="todo-date">Created {formattedDate}</span>
      </div>

      <div className="todo-actions">
        <button
          className="btn-icon edit-btn"
          onClick={() => setEditing(true)}
          aria-label="Edit todo"
          title="Edit"
          disabled={deleting}
        >
          ✏️
        </button>
        <button
          className="btn-icon delete-btn"
          onClick={handleDelete}
          aria-label="Delete todo"
          title="Delete"
          disabled={deleting}
        >
          🗑️
        </button>
      </div>
    </li>
  );
};

export default TodoItem;
