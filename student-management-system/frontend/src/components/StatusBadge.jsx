const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${status === 'Active'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700'}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
    {status}
  </span>
);

export default StatusBadge;
