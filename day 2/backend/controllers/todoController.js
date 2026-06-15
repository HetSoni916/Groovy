const TodoModel = require("../models/todoModel");

// GET /todos
const getAllTodos = (req, res) => {
  const todos = TodoModel.getAll();
  res.json({ success: true, data: todos, count: todos.length });
};

// POST /todos
const createTodo = (req, res) => {
  const { title, description } = req.body;

  if (!title || !title.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Title is required" });
  }
  if (title.trim().length > 100) {
    return res
      .status(400)
      .json({ success: false, message: "Title must be 100 characters or less" });
  }

  const todo = TodoModel.create(title, description);
  res.status(201).json({ success: true, data: todo });
};

// PUT /todos/:id
const updateTodo = (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;

  if (!TodoModel.getById(id)) {
    return res.status(404).json({ success: false, message: "Todo not found" });
  }

  if (title !== undefined) {
    if (!title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title cannot be empty" });
    }
    if (title.trim().length > 100) {
      return res
        .status(400)
        .json({ success: false, message: "Title must be 100 characters or less" });
    }
  }

  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (completed !== undefined) updates.completed = Boolean(completed);

  const updated = TodoModel.update(id, updates);
  res.json({ success: true, data: updated });
};

// DELETE /todos/:id
const deleteTodo = (req, res) => {
  const { id } = req.params;

  if (!TodoModel.delete(id)) {
    return res.status(404).json({ success: false, message: "Todo not found" });
  }

  res.json({ success: true, message: "Todo deleted successfully" });
};

module.exports = { getAllTodos, createTodo, updateTodo, deleteTodo };
