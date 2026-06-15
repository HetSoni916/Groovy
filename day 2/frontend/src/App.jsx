import React from "react";
import useTodos from "./hooks/useTodos";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import FilterBar from "./components/FilterBar";
import SearchBar from "./components/SearchBar";
import "./App.css";

const App = () => {
  const {
    todos,
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
  } = useTodos();

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="app-header">
          <h1>✅ Todo App</h1>
          <p className="subtitle">
            {counts.active} task{counts.active !== 1 ? "s" : ""} remaining
          </p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button onClick={clearError} aria-label="Dismiss error">✕</button>
          </div>
        )}

        {/* Add Todo Form */}
        <section className="add-section">
          <TodoForm onSubmit={addTodo} />
        </section>

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Filter Bar */}
        <FilterBar active={filter} counts={counts} onFilterChange={setFilter} />

        {/* Todo List */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" aria-label="Loading todos" />
            <p>Loading todos...</p>
          </div>
        ) : (
          <TodoList
            todos={todos}
            filter={filter}
            search={search}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onToggle={toggleComplete}
          />
        )}

        {/* Footer */}
        {!loading && counts.all > 0 && (
          <footer className="app-footer">
            {counts.all} total · {counts.completed} done · {counts.active} remaining
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;
