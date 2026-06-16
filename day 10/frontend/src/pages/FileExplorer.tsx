import { useEffect, useState } from 'react';
import { getRepoFiles, getFileContent } from '../services/api';
import { FileInfo } from '../types';

interface Props {
  repoId: string | null;
}

export default function FileExplorer({ repoId }: Props) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    getRepoFiles(repoId)
      .then(setFiles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [repoId]);

  const openFile = async (path: string) => {
    if (!repoId) return;
    setSelected(path);
    setContentLoading(true);
    try {
      const text = await getFileContent(repoId, path);
      setContent(text);
    } catch {
      setContent('// Could not load file content');
    } finally {
      setContentLoading(false);
    }
  };

  if (!repoId) {
    return <div className="text-center text-gray-400 mt-12">No repository loaded. Upload one first.</div>;
  }

  if (loading) return <div className="text-center text-gray-400 mt-12">Loading files...</div>;
  if (error) return <div className="text-center text-red-400 mt-12">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto flex gap-4 h-[calc(100vh-8rem)]">
      <div className="w-64 bg-gray-800 rounded-lg border border-gray-700 overflow-y-auto shrink-0">
        <div className="p-2 border-b border-gray-700 text-xs font-semibold text-gray-400">
          Files ({files.length})
        </div>
        {files.map((f) => (
          <button
            key={f.id}
            onClick={() => openFile(f.path)}
            className={`w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-gray-700 transition-colors ${
              selected === f.path ? 'bg-blue-900 text-blue-300' : 'text-gray-300'
            }`}
          >
            <span className="text-gray-500 mr-2">{f.language}</span>
            {f.path}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 overflow-y-auto">
        {selected ? (
          contentLoading ? (
            <div className="p-4 text-gray-400">Loading...</div>
          ) : (
            <pre className="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap">{content}</pre>
          )
        ) : (
          <div className="p-4 text-gray-500 text-sm">Select a file to view its contents</div>
        )}
      </div>
    </div>
  );
}
