const { v7: uuidv7 } = require("uuid");

// In-memory store
let todos = [];

const TodoModel = {
  getAll: () => todos,

  getById: (id) => todos.find((t) => t.id === id),

  create: (title, description = "") => {
    const todo = {
      id: uuidv7(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    todos.push(todo);
    return todo;
  },

  update: (id, updates) => {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return null;
    todos[index] = {
      ...todos[index],
      ...updates,
      id, // prevent id override
      updatedAt: new Date().toISOString(),
    };
    return todos[index];
  },

  delete: (id) => {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return false;
    todos.splice(index, 1);
    return true;
  },
};

module.exports = TodoModel;
