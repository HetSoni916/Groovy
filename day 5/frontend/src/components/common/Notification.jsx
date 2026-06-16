const Notification = ({ type = 'info', message, onClose }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  if (!message) return null;

  return (
    <div className={`border rounded-lg p-4 mb-4 flex justify-between items-start ${styles[type]}`}>
      <p className="text-sm">{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
          ✕
        </button>
      )}
    </div>
  );
};

export default Notification;
