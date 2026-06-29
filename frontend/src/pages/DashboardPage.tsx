import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film, Plus, Clock, CheckCircle2, XCircle, Loader2,
  ExternalLink, Upload, Link2, FileVideo, X, Wand2,
} from 'lucide-react';
import { projectApi } from '../services/api';
import type { Project } from '../types';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'text-yellow-400', icon: Clock, label: 'Pending' },
  link_added: { color: 'text-blue-400', icon: Link2, label: 'Link Added' },
  files_uploaded: { color: 'text-blue-400', icon: Upload, label: 'Files Uploaded' },
  queued: { color: 'text-blue-400', icon: Loader2, label: 'Queued' },
  processing: { color: 'text-blue-400', icon: Loader2, label: 'Processing' },
  completed: { color: 'text-green-400', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'text-red-400', icon: XCircle, label: 'Failed' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [link, setLink] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const data = await projectApi.listProjects();
      setProjects(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (mode === 'link') {
        if (!link.trim()) return;
        const project = await projectApi.createProject({ dropbox_link: link, name: 'Dropbox Project' });
        navigate(`/processing/${project.id}`);
      } else {
        if (files.length === 0) return;
        const project = await projectApi.createProject({ name: files[0].name });
        await projectApi.uploadFiles(project.id, files);
        navigate(`/processing/${project.id}`);
      }
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  return (
    <div className="min-h-screen bg-dark-400">
      <header className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-accent-400" />
            <span className="text-lg font-semibold">AI Video Editor</span>
          </div>
          <button onClick={() => navigate('/')} className="btn-secondary text-sm py-2 px-4">Home</button>
          <button onClick={() => navigate('/prompt')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 text-sm font-medium transition-all">
            <Wand2 className="w-4 h-4" /> Prompt Mode
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <button onClick={() => setShowNew(!showNew)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {showNew && (
          <div className="mb-8 glass-panel p-6">
            <h2 className="font-semibold mb-4">Create New Project</h2>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setMode('upload')}
                className={`px-4 py-1.5 rounded-lg text-sm ${mode === 'upload' ? 'bg-accent-500 text-white' : 'bg-dark-300 text-gray-400'}`}>
                <Upload className="w-4 h-4 inline mr-1" />Upload
              </button>
              <button onClick={() => setMode('link')}
                className={`px-4 py-1.5 rounded-lg text-sm ${mode === 'link' ? 'bg-accent-500 text-white' : 'bg-dark-300 text-gray-400'}`}>
                <Link2 className="w-4 h-4 inline mr-1" />Dropbox
              </button>
            </div>
            <form onSubmit={handleCreate}>
              {mode === 'link' ? (
                <div className="flex gap-3">
                  <input type="url" value={link} onChange={e => setLink(e.target.value)}
                    placeholder="Dropbox shared folder link..." className="input-dark flex-1" />
                  <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              ) : (
                <div>
                  <div onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 hover:border-accent-500/50 rounded-xl p-6 cursor-pointer text-center transition-colors">
                    <FileVideo className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Click to select video files</p>
                    <input ref={fileRef} type="file" multiple accept=".mp4,.mov,.avi,.mkv,.webm" className="hidden"
                      onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                  </div>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-dark-300 rounded px-3 py-1.5 text-sm">
                          <span className="truncate text-gray-300">{f.name}</span>
                          <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      <button type="submit" disabled={creating} className="btn-primary w-full mt-2">
                        {creating ? 'Creating...' : `Process ${files.length} file${files.length > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-accent-400 animate-spin" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Upload videos or paste a Dropbox link to get started</p>
            <button onClick={() => setShowNew(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const cfg = statusConfig[project.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={project.id} className="card-dark flex items-center justify-between hover:border-gray-700 transition-all cursor-pointer"
                  onClick={() => project.status === 'completed' ? navigate(`/preview/${project.id}`) : navigate(`/processing/${project.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className={cfg.color}>
                      <StatusIcon className={`w-5 h-5 ${['processing', 'queued'].includes(project.status) ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-md">{project.dropbox_link || 'Local Upload'}</p>
                      <p className="text-sm text-gray-500">{new Date(project.created_at).toLocaleDateString()} &middot; {Math.round(project.progress * 100)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${cfg.color}`}>{cfg.label}</span>
                    {project.status === 'completed' && <ExternalLink className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
