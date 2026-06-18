import { ChunkResult } from '../types';

interface Props {
  chunks: ChunkResult[];
}

export default function ChromaTable({ chunks }: Props) {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-700">
      <p className="text-xs text-gray-500 font-semibold mb-2">ChromaDB Search Results:</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-700/50">
              <th className="px-2 py-1.5 text-left text-gray-400 font-medium border-b border-gray-600">ID</th>
              <th className="px-2 py-1.5 text-left text-gray-400 font-medium border-b border-gray-600">Doc</th>
              <th className="px-2 py-1.5 text-left text-gray-400 font-medium border-b border-gray-600">Page</th>
              <th className="px-2 py-1.5 text-left text-gray-400 font-medium border-b border-gray-600">Score</th>
              <th className="px-2 py-1.5 text-left text-gray-400 font-medium border-b border-gray-600">Text</th>
            </tr>
          </thead>
          <tbody>
            {chunks.map((c, i) => (
              <tr key={i} className="hover:bg-gray-700/30">
                <td className="px-2 py-1.5 text-gray-300 font-mono border-b border-gray-700/50">{c.id}</td>
                <td className="px-2 py-1.5 text-gray-300 border-b border-gray-700/50">{c.filename}</td>
                <td className="px-2 py-1.5 text-gray-300 border-b border-gray-700/50">
                  {c.pageStart}{c.pageStart !== c.pageEnd ? `-${c.pageEnd}` : ''}
                </td>
                <td className="px-2 py-1.5 text-green-400 font-mono border-b border-gray-700/50">
                  {(c.score * 100).toFixed(1)}%
                </td>
                <td className="px-2 py-1.5 text-gray-400 border-b border-gray-700/50 max-w-[200px] truncate">
                  {c.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
