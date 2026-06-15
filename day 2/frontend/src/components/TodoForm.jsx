import React, { useState, useEffect } from "react";

const MAX_TITLE = 100;

const TodoForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Sync fields when editing a different todo
  useEffect(() => {
    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = "Title is required";
    else if (title.trim().length > MAX_TITLE)
      errs.title = `Title must be ${MAX_TITLE} characters or less`;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setSubmitting(true);
    try {
      await onSubmit(title.trim(), description.trim());
      if (!initialData) {
        setTitle("");
        setDescription("");
      }
      setErrors({});
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = Boolean(initialData);

  return (
    <form className={`todo-form ${isEdit ? "edit-form" : ""}`} onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <input
          type="text"
          placeholder="What needs to be done? *"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((p) => ({ ...p, title: "" }));
          }}
          className={errors.title ? "input-error" : ""}
          aria-label="Todo title"
          maxLength={MAX_TITLE + 1}
          disabled={submitting}
        />
        <span className="char-count" style={{ color: title.length > MAX_TITLE ? "#ef4444" : "" }}>
          {title.length}/{MAX_TITLE}
        </span>
        {errors.title && <span className="error-msg">{errors.title}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Todo description"
          disabled={submitting}
        />
      </div>

      {errors.form && <div className="form-error">{errors.form}</div>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Todo"}
        </button>
        {isEdit && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TodoForm;
