import React from "react";

const FILTERS = ["all", "active", "completed"];

const FilterBar = ({ active, counts, onFilterChange }) => (
  <div className="filter-bar">
    {FILTERS.map((f) => (
      <button
        key={f}
        className={`filter-btn ${active === f ? "active" : ""}`}
        onClick={() => onFilterChange(f)}
        aria-pressed={active === f}
      >
        {f.charAt(0).toUpperCase() + f.slice(1)}
        <span className="filter-count">{counts[f]}</span>
      </button>
    ))}
  </div>
);

export default FilterBar;
