const FormField = ({ label, error, required, children }) => (
  <div>
    <label className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="error-text">{error}</p>}
  </div>
);

export default FormField;
