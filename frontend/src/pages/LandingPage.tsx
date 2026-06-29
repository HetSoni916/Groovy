import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Upload, Music, Share2, ArrowRight, FileVideo, Link2, X, Wand2 } from 'lucide-react';
import { projectApi } from '../services/api';

const features = [
  {
    icon: Upload,
    title: 'Upload Videos',
    desc: 'Drag & drop your MP4/MOV files directly, or paste a Dropbox folder link.',
  },
  {
    icon: Film,
    title: 'AI-Powered Analysis',
    desc: 'Our AI analyzes every clip for quality, motion, scenes, and emotional tone.',
  },
  {
    icon: Music,
    title: 'Smart Editing',
    desc: 'Automatic transitions, intelligent clip ordering, and background music.',
  },
  {
    icon: Share2,
    title: 'Instant Export',
    desc: 'Get a polished 30-60 second cinematic video ready to share.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [link, setLink] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'link') {
        if (!link.trim()) { setError('Enter a Dropbox link'); setLoading(false); return; }
        const project = await projectApi.createProject({ dropbox_link: link, name: 'Dropbox Project' });
        navigate(`/processing/${project.id}`);
      } else {
        if (files.length === 0) { setError('Select video files to upload'); setLoading(false); return; }
        const project = await projectApi.createProject({ name: files[0].name });
        await projectApi.uploadFiles(project.id, files);
        navigate(`/processing/${project.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      ['.mp4', '.mov', '.avi', '.mkv', '.webm'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(prev => [...prev, ...dropped]);
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-400 via-dark-300 to-dark-500">
      <header className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-accent-400" />
            <span className="text-lg font-semibold">AI Video Editor</span>
          </div>
          <button
            onClick={() => navigate('/prompt')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 text-sm font-medium transition-all"
          >
            <Wand2 className="w-4 h-4" />
            Prompt Mode
          </button>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 pt-16 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500/10 border border-accent-500/20 rounded-full text-accent-300 text-sm mb-8">
          <Film className="w-4 h-4" />
          No Dropbox account required
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-white via-accent-200 to-accent-400 bg-clip-text text-transparent">
          Turn Raw Clips Into
          <br />
          Cinematic Videos
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          Upload videos from your computer or paste a Dropbox link. AI edits everything automatically.
        </p>

        <div className="flex items-center justify-center gap-2 mb-8">
          <button onClick={() => setMode('upload')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'upload' ? 'bg-accent-500 text-white' : 'bg-dark-200 text-gray-400 hover:text-white'}`}>
            <Upload className="w-4 h-4 inline mr-1.5" />Upload Files
          </button>
          <button onClick={() => setMode('link')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'link' ? 'bg-accent-500 text-white' : 'bg-dark-200 text-gray-400 hover:text-white'}`}>
            <Link2 className="w-4 h-4 inline mr-1.5" />Dropbox Link
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'link' ? (
            <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
              <input type="url" value={link} onChange={e => { setLink(e.target.value); setError(''); }}
                placeholder="Paste Dropbox shared folder link..."
                className="input-dark flex-1" />
              <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
                {loading ? 'Creating...' : 'Create'} <ArrowRight className="w-4 h-4 inline" />
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-700 hover:border-accent-500/50 rounded-2xl p-10 cursor-pointer transition-colors">
                <FileVideo className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Drop video files here or click to browse</p>
                <p className="text-gray-600 text-sm mt-1">MP4, MOV, AVI, MKV, WebM</p>
                <input ref={fileRef} type="file" multiple accept=".mp4,.mov,.avi,.mkv,.webm"
                  className="hidden" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              </div>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-dark-200 rounded-lg px-4 py-2 text-sm">
                      <span className="truncate text-gray-300">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 ml-2"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="submit" disabled={loading}
                    className="btn-primary w-full mt-3">
                    {loading ? 'Creating...' : `Process ${files.length} file${files.length > 1 ? 's' : ''}`} <ArrowRight className="w-4 h-4 inline" />
                  </button>
                </div>
              )}
            </div>
          )}
          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </form>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card-dark hover:border-accent-500/30 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20">
                <f.icon className="w-5 h-5 text-accent-400" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="glass-panel p-8 sm:p-12">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Upload Clips', desc: 'Drop video files or share a Dropbox link' },
              { step: '02', title: 'AI Analysis', desc: 'We scan and analyze every clip' },
              { step: '03', title: 'Auto Edit', desc: 'AI creates the perfect sequence' },
              { step: '04', title: 'Download', desc: 'Get your cinematic video' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto mb-3 text-accent-300 font-bold text-sm">
                  {s.step}
                </div>
                <h4 className="font-medium mb-1">{s.title}</h4>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800/50 py-8 text-center text-sm text-gray-500">
        <p>AI Video Editor &mdash; Works with local uploads or Dropbox</p>
      </footer>
    </div>
  );
}
