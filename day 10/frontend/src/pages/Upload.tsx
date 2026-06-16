import { useState } from 'react';
import { uploadRepo } from '../services/api';
import { Repository } from '../types';

interface Props {
  onRepoLoaded: (id: string) => void;
}

export default function Upload({ onRepoLoaded }: Props) {
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repo, setRepo] = useState<Repository | null>(null);

  const handleUpload = async () => {
    if (!path.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await uploadRepo(path.trim());
      setRepo(result);
      onRepoLoaded(result.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-2">Upload a Codebase</h2>
        <p className="text-gray-400 text-sm mb-4">
          Enter the absolute path to a local directory to analyze its code structure.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="C:\Projects\my-app"
            className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleUpload}
            disabled={loading || !path.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {loading ? 'Scanning...' : 'Analyze'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {repo && (
          <div className="mt-4 p-3 bg-gray-900 rounded text-sm">
            <p><span className="text-gray-400">Name:</span> {repo.name}</p>
            <p><span className="text-gray-400">Files:</span> {repo.files.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}
