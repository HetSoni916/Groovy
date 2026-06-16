import { useState, useEffect } from 'react';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import FileExplorer from './pages/FileExplorer';

type Page = 'upload' | 'dashboard' | 'chat' | 'files';

export default function App() {
  const [page, setPage] = useState<Page>('upload');
  const [repoId, setRepoId] = useState<string | null>(null);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const nav = (p: Page) => (
    <button
      key={p}
      onClick={() => setPage(p)}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
        page === p
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:text-white hover:bg-gray-700'
      }`}
    >
      {p === 'upload' ? 'Upload' : p === 'dashboard' ? 'Dashboard' : p === 'chat' ? 'Chat' : 'Files'}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 dark:bg-gray-950 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white">CodeBase Explainer</h1>
          {repoId && <span className="text-xs text-gray-400">Repo: {repoId.slice(0, 8)}...</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {nav('upload')}
            {nav('dashboard')}
            {nav('chat')}
            {nav('files')}
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-gray-700"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 overflow-auto">
        {page === 'upload' && <Upload onRepoLoaded={(id) => { setRepoId(id); setPage('dashboard'); }} />}
        {page === 'dashboard' && <Dashboard repoId={repoId} />}
        {page === 'chat' && <Chat repoId={repoId} />}
        {page === 'files' && <FileExplorer repoId={repoId} />}
      </main>
    </div>
  );
}
