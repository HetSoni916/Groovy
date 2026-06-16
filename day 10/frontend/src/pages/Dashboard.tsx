import { useEffect, useState } from 'react';
import { getRepoSummary, getRepoDescription } from '../services/api';
import { RepoSummary } from '../types';

interface Props {
  repoId: string | null;
}

export default function Dashboard({ repoId }: Props) {
  const [summary, setSummary] = useState<RepoSummary | null>(null);
  const [description, setDescription] = useState('');
  const [descLoading, setDescLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    getRepoSummary(repoId)
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [repoId]);

  useEffect(() => {
    if (!repoId) return;
    setDescLoading(true);
    getRepoDescription(repoId)
      .then(setDescription)
      .catch(() => setDescription(''))
      .finally(() => setDescLoading(false));
  }, [repoId]);

  if (!repoId) {
    return (
      <div className="text-center text-gray-400 mt-12">
        No repository loaded. Upload one first.
      </div>
    );
  }

  if (loading) return <div className="text-center text-gray-400 mt-12">Loading summary...</div>;
  if (error) return <div className="text-center text-red-400 mt-12">{error}</div>;
  if (!summary) return <div className="text-center text-gray-400 mt-12">No summary available.</div>;

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-gray-800 rounded p-3 border border-gray-700">
      <div className="text-2xl font-bold text-blue-400">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">{summary.projectName}</h2>

      {descLoading ? (
        <div className="bg-gray-800 rounded p-4 border border-gray-700 text-gray-400 text-sm">Generating project description...</div>
      ) : description ? (
        <div className="bg-gray-800 rounded p-4 border border-blue-700/50">
          <p className="text-sm text-gray-200 leading-relaxed">{description}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Files" value={summary.totalFiles} />
        <Stat label="Lines of Code" value={summary.totalLines} />
        <Stat label="Tech Stack" value={summary.techStack.length} />
        <Stat label="API Routes" value={summary.apiRoutes.length} />
      </div>

      <div className="bg-gray-800 rounded p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {summary.techStack.map((t) => (
            <span key={t} className="bg-gray-700 text-xs px-2 py-1 rounded-full">{t}</span>
          ))}
        </div>
      </div>

      {summary.entryPoints.length > 0 && (
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Entry Points</h3>
          <ul className="text-sm space-y-1">
            {summary.entryPoints.map((ep) => (
              <li key={ep} className="text-blue-400 font-mono text-xs">{ep}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.apiRoutes.length > 0 && (
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">API Routes</h3>
          <ul className="text-sm space-y-1">
            {summary.apiRoutes.map((r) => (
              <li key={r} className="text-green-400 font-mono text-xs">{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-800 rounded p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Folder Structure</h3>
        <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">{summary.folderStructure}</pre>
      </div>
    </div>
  );
}
