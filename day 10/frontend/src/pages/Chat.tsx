import { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../services/api';
import { ChatMessage, Reference, Usage } from '../types';

interface Props {
  repoId: string | null;
}

export default function Chat({ repoId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('groq');
  const [mode, setMode] = useState<'beginner' | 'advanced'>('beginner');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async () => {
    if (!repoId || !question.trim()) return;
    setLoading(true);
    try {
      const res = await askQuestion(repoId, question, mode, provider);
      const msg: ChatMessage = {
        id: Date.now().toString(),
        question,
        answer: res.answer,
        references: res.references,
        usage: res.usage,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      setQuestion('');
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          question,
          answer: `Error: ${e.message}`,
          references: [],
          usage: { input: 0, output: 0, cost: 0 },
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {!repoId ? (
        <div className="text-center text-gray-400 mt-12">No repository loaded. Upload one first.</div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs"
            >
              <option value="groq">Groq (llama-3.3-70b)</option>
              <option value="gemini">Gemini (2.0 Flash)</option>
              <option value="cohere">Cohere (command-r)</option>
            </select>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'beginner' | 'advanced')}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs"
            >
              <option value="beginner">Beginner mode</option>
              <option value="advanced">Advanced mode</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-3">
            {messages.map((msg) => (
              <MessageCard key={msg.id} msg={msg} />
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask a question about this codebase..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MessageCard({ msg }: { msg: ChatMessage }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="mb-2">
        <span className="text-xs text-gray-500 font-mono">
          Q: {msg.question}
        </span>
      </div>
      <div className="text-sm whitespace-pre-wrap mb-3">{msg.answer}</div>

      {msg.references.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {expanded ? 'Hide' : 'Show'} references ({msg.references.length})
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              {msg.references.map((ref, i) => (
                <div key={i} className="bg-gray-900 rounded p-2 text-xs font-mono text-gray-400">
                  <span className="text-green-400">{ref.file}</span> ({ref.lines})
                  <div className="text-gray-500 mt-1">{ref.snippet}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-600 flex gap-3 mt-2">
        <span>Input: {msg.usage.input} tokens</span>
        <span>Output: {msg.usage.output} tokens</span>
        <span>Cost: ${msg.usage.cost.toFixed(5)}</span>
      </div>
    </div>
  );
}
