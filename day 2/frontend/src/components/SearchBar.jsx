import React from "react";

const SearchBar = ({ value, onChange }) => (
  <div className="search-bar">
    <span className="search-icon">🔍</span>
    <input
      type="text"
      placeholder="Search todos by title or description..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search todos"
    />
    {value && (
      <button className="clear-search" onClick={() => onChange("")} aria-label="Clear search">
        ✕
      </button>
    )}
  </div>
);

export default SearchBar;
