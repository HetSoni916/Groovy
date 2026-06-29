import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film, CheckCircle2, Loader2, XCircle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { projectApi } from '../services/api';
import type { ProjectStatusResponse } from '../types';

const PROCESSING_STEPS = [
  { key: 'ready', label: 'Videos Ready', icon: Film },
  { key: 'analyze', label: 'AI Analyzing Scenes', icon: Loader2 },
  { key: 'select', label: 'Selecting Best Shots', icon: Loader2 },
  { key: 'story', label: 'Creating Story', icon: Loader2 },
  { key: 'transitions', label: 'Adding Transitions', icon: Loader2 },
  { key: 'music', label: 'Syncing Music', icon: Loader2 },
  { key: 'render', label: 'Rendering Final Video', icon: Loader2 },
];

export default function ProcessingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProjectStatusResponse | null>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  const pollStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await projectApi.getProjectStatus(projectId);
      setStatus(data);
      if (data.status === 'completed') {
        setTimeout(() => navigate(`/preview/${projectId}`), 1500);
      }
      if (data.status === 'failed') {
        setError(data.error_message || 'Processing failed');
      }
    } catch {
      setError('Failed to fetch project status');
    }
  }, [projectId, navigate]);

  useEffect(() => {
    if (!projectId) return;
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [projectId, pollStatus]);

  const handleStartProcessing = async () => {
    if (!projectId) return;
    setStarted(true);
    try {
      await projectApi.generateVideo(projectId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start processing');
    }
  };

  const progress = status?.progress ?? 0;
  const currentStepIndex = Math.min(Math.floor(progress * PROCESSING_STEPS.length), PROCESSING_STEPS.length - 1);

  return (
    <div className="min-h-screen bg-dark-400 flex flex-col">
      <header className="border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-accent-400" />
            <span className="text-lg font-semibold">AI Video Editor</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {!started && (status?.status === 'pending' || status?.status === 'files_uploaded' || status?.status === 'link_added') ? (
            <div className="glass-panel p-8 text-center">
              <Film className="w-16 h-16 text-accent-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Ready to Process</h2>
              <p className="text-gray-400 mb-8">Your videos are uploaded. Start AI processing to create your cinematic video.</p>
              <button onClick={handleStartProcessing} className="btn-primary text-lg px-8 py-4">Start AI Processing</button>
            </div>
          ) : (
            <div className="glass-panel p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  {status?.status === 'completed' ? 'Processing Complete!' : status?.status === 'failed' ? 'Processing Failed' : 'Processing Your Video'}
                </h2>
                <p className="text-gray-400">{status?.current_step || 'Initializing...'}</p>
              </div>

              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-dark-500 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ease-out ${status?.status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-accent-500 to-accent-400'}`}
                    style={{ width: `${Math.max(progress * 100, 5)}%` }} />
                </div>
              </div>

              <div className="space-y-3">
                {PROCESSING_STEPS.map((step, i) => {
                  const isActive = i === currentStepIndex && status?.status === 'processing';
                  const isComplete = i < currentStepIndex || status?.status === 'completed';
                  const isError = status?.status === 'failed' && i === currentStepIndex;
                  return (
                    <div key={step.key} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? 'bg-accent-500/10 border border-accent-500/20' : isComplete ? 'bg-green-500/5' : ''}`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /> :
                       isError ? <XCircle className="w-5 h-5 text-red-400 shrink-0" /> :
                       isActive ? <Loader2 className="w-5 h-5 text-accent-400 animate-spin shrink-0" /> :
                       <div className="w-5 h-5 rounded-full border-2 border-gray-600 shrink-0" />}
                      <span className={`text-sm ${isComplete ? 'text-green-400' : isActive ? 'text-accent-300' : 'text-gray-500'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={handleStartProcessing} className="mt-3 btn-secondary text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              )}

              {status?.status === 'completed' && (
                <div className="mt-6">
                  <button onClick={() => navigate(`/preview/${projectId}`)} className="btn-primary w-full flex items-center justify-center gap-2">
                    View Video <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
