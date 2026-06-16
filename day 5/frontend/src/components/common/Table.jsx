import Loader from './Loader';

const Table = ({ columns, data, loading, onSort, sortBy, sortOrder, onRowClick, emptyMessage = 'No data found' }) => {
  const getSortIcon = (key) => {
    if (sortBy !== key) return '↕';
    return sortOrder === 'ASC' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="card">
        <Loader className="py-12" size="lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                  }`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={{ width: col.width }}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <span className="text-gray-400 text-xs">{getSortIcon(col.key)}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
