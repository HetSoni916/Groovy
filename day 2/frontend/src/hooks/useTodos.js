import { useState, useEffect, useCallback } from "react";
import todoService from "../services/todoService";

const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | active | completed
  const [search, setSearch] = useState("");

  const clearError = () => setError(null);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await todoService.getAll();
      setTodos(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (title, description) => {
    const res = await todoService.create(title, description);
    setTodos((prev) => [res.data, ...prev]);
  };

  const updateTodo = async (id, updates) => {
    try {
      const res = await todoService.update(id, updates);
      setTodos((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoService.delete(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleComplete = (id, completed) => updateTodo(id, { completed: !completed });

  // Derived filtered + searched list
  const filteredTodos = todos
    .filter((t) => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    })
    .filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  return {
    todos: filteredTodos,
    loading,
    error,
    filter,
    search,
    counts,
    setFilter,
    setSearch,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    clearError,
  };
};

export default useTodos;
