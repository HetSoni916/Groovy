import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Film,
  ArrowLeft,
  Download,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { projectApi } from '../services/api';
import type { Project } from '../types';

export default function PreviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const projects = await projectApi.listProjects();
      const p = projects.find((pr) => pr.id === projectId);
      if (p) setProject(p);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!project?.final_video_url) return;
    const filename = project.final_video_url.split('/').pop();
    if (!filename) return;

    try {
      const response = await fetch(projectApi.downloadVideo(filename));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(projectApi.downloadVideo(filename), '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Project not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const videoFilename = project.final_video_url?.split('/').pop();
  const videoUrl = videoFilename ? projectApi.previewVideo(videoFilename) : '';

  return (
    <div className="min-h-screen bg-dark-400 flex flex-col">
      <header className="border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-accent-400" />
            <span className="text-lg font-semibold">AI Video Editor</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Your Cinematic Video</h1>
          <p className="text-gray-400 text-sm">
            Created from your Dropbox clips using AI-powered editing
          </p>
        </div>

        <div className="glass-panel overflow-hidden mb-6">
          <div className="aspect-video bg-black relative group">
            {videoUrl ? (
              <>
                <video
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onLoadedData={() => setVideoLoaded(true)}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  controls
                />
                {!videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-500">
                    <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-500">
                <p className="text-gray-500">Video not available</p>
              </div>
            )}

            {!playing && videoLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => {
                  const video = document.querySelector('video');
                  video?.play();
                }}
              >
                <div className="w-16 h-16 rounded-full bg-accent-500/80 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Completed
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
              <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Video
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="font-semibold mb-4">Project Details</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status</span>
              <p className="text-green-400 font-medium">Completed</p>
            </div>
            <div>
              <span className="text-gray-500">Dropbox Source</span>
              <p className="text-gray-300 truncate">{project.dropbox_link}</p>
            </div>
            <div>
              <span className="text-gray-500">Created</span>
              <p className="text-gray-300">
                {new Date(project.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Progress</span>
              <p className="text-gray-300">{Math.round(project.progress * 100)}%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
