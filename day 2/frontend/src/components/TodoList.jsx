import React from "react";
import TodoItem from "./TodoItem";

const EMPTY_MESSAGES = {
  all: { icon: "📋", text: "No todos yet. Add one above!" },
  active: { icon: "✅", text: "No active todos. Great job!" },
  completed: { icon: "🎯", text: "No completed todos yet." },
};

const TodoList = ({ todos, filter, search, onUpdate, onDelete, onToggle }) => {
  if (!todos.length) {
    const msg = search
      ? { icon: "🔍", text: `No todos match "${search}"` }
      : EMPTY_MESSAGES[filter];
    return (
      <div className="empty-state">
        <span className="empty-icon">{msg.icon}</span>
        <p>{msg.text}</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
};

export default TodoList;
