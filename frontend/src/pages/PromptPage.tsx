import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Film, ArrowRight, Wand2, Loader2 } from 'lucide-react';
import { projectApi } from '../services/api';

const examplePrompts = [
  'Make a cinematic travel video with smooth transitions and ambient music',
  'Create an energetic sports highlight reel with fast pacing',
  'A romantic sunset montage with soft piano music',
  'Epic drone footage compilation with dramatic transitions',
  'Calm nature documentary style with slow pacing',
];

export default function PromptPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setError('');
    try {
      const result = await projectApi.analyzePrompt(prompt);
      setAnalysis(result);
    } catch {
      setError('Failed to analyze prompt');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const project = await projectApi.generateFromPrompt(prompt, 'Prompt Video');
      navigate(`/processing/${project.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start generation');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-400 via-dark-300 to-dark-500">
      <header className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-accent-400" />
            <span className="text-lg font-semibold">AI Video Editor</span>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">
            Back to Home
          </button>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-6">
            <Wand2 className="w-4 h-4" />
            Prompt-to-Video AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Describe Your Video
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Tell the AI what kind of video you want. It will analyze your uploaded clips and create the perfect edit based on your description.
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            What kind of video do you want to create?
          </label>
          <textarea
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setError(''); setAnalysis(null); }}
            placeholder="e.g. Make a cinematic travel video with smooth transitions and peaceful music..."
            rows={4}
            className="input-dark w-full resize-none"
          />

          <div className="flex flex-wrap gap-2 mt-3">
            {examplePrompts.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setPrompt(ex); setAnalysis(null); }}
                className="text-xs px-3 py-1.5 bg-dark-200 hover:bg-dark-100 text-gray-400 hover:text-white rounded-full transition-colors"
              >
                {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAnalyze}
              disabled={!prompt.trim() || analyzing}
              className="px-5 py-2.5 rounded-lg bg-dark-200 hover:bg-dark-100 text-gray-300 hover:text-white font-medium text-sm transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 inline mr-1.5 animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 inline mr-1.5" />Analyze Prompt</>
              )}
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 inline mr-1.5 animate-spin" />Starting...</>
              ) : (
                <>Generate Video <ArrowRight className="w-4 h-4 inline" /></>
              )}
            </button>
          </div>

          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}

          {analysis && (
            <div className="mt-6 p-4 bg-dark-200/50 rounded-xl border border-gray-700/50">
              <h3 className="text-sm font-semibold text-accent-300 mb-3">AI Analysis Result</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Mood</span>
                  <p className="text-white font-medium capitalize">{analysis.mood}</p>
                </div>
                <div>
                  <span className="text-gray-500">Emotion</span>
                  <p className="text-white font-medium capitalize">{analysis.emotion}</p>
                </div>
                <div>
                  <span className="text-gray-500">Pacing</span>
                  <p className="text-white font-medium capitalize">{analysis.pacing}</p>
                </div>
                <div>
                  <span className="text-gray-500">Music Style</span>
                  <p className="text-white font-medium capitalize">{analysis.music_mood.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Clip Count</span>
                  <p className="text-white font-medium">{analysis.clip_count} clips</p>
                </div>
                <div>
                  <span className="text-gray-500">Content</span>
                  <p className="text-white font-medium capitalize">{analysis.content_preference}</p>
                </div>
              </div>
              {analysis.description && (
                <p className="mt-3 text-xs text-gray-400">{analysis.description}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            No uploads needed — the AI uses a built-in stock footage library matched to your prompt.
            You can also upload your own clips for personalized edits.
          </p>
        </div>
      </section>
    </div>
  );
}
