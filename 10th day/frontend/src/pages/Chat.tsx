import { useEffect, useState } from 'react';
import { listPdfs, deletePdf, uploadPdf } from '../services/api';
import { Document, PdfUploadResponse } from '../types';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import CostPanel from '../components/CostPanel';
import { askQuestion, getChatHistory, clearChatHistory } from '../services/api';
import { ChatEntry, TokenUsage, ChunkResult } from '../types';
import ChromaTable from '../components/ChromaTable';

export default function Chat() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUsage, setLastUsage] = useState<TokenUsage | null>(null);
  const [lastChunks, setLastChunks] = useState<ChunkResult[]>([]);

  useEffect(() => {
    loadDocuments();
    loadHistory();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await listPdfs();
      setDocuments(docs);
    } catch { /* ignore */ }
  };

  const loadHistory = async () => {
    try {
      const history = await getChatHistory();
      setMessages(history);
    } catch { /* ignore */ }
  };

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed');
      return;
    }
    setUploading(true);
    try {
      await uploadPdf(file);
      await loadDocuments();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePdf(id);
      setSelectedIds(prev => prev.filter(s => s !== id));
      await loadDocuments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const q = question;
    setQuestion('');

    const userEntry: ChatEntry = {
      id: Date.now().toString(),
      question: q,
      answer: '',
      sources: [],
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, latencyMs: 0, model: '' },
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userEntry]);

    try {
      const result = await askQuestion(q, selectedIds.length > 0 ? selectedIds : undefined);
      const entry: ChatEntry = {
        id: (Date.now() + 1).toString(),
        question: q,
        answer: result.answer,
        sources: result.sources,
        usage: result.usage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev.slice(0, -1), entry]);
      setLastUsage(result.usage);
      setLastChunks(result.chunks || []);
    } catch (e: any) {
      const errorEntry: ChatEntry = {
        id: (Date.now() + 1).toString(),
        question: q,
        answer: `Error: ${e.message}`,
        sources: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, latencyMs: 0, model: '' },
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev.slice(0, -1), errorEntry]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearChatHistory();
    setMessages([]);
    setLastUsage(null);
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        documents={documents}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpload={handleUpload}
        uploading={uploading}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <div className="text-5xl mb-4 opacity-30">📝</div>
              <h2 className="text-xl font-semibold text-gray-500 mb-1">Ask My Notes</h2>
              <p className="text-sm">Upload PDF notes and ask questions about them</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatMessage question={msg.question} answer={msg.answer} sources={msg.sources} isUser />
              <ChatMessage question={msg.question} answer={msg.answer} sources={msg.sources} />
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {lastChunks.length > 0 && <div className="px-4 pb-2"><ChromaTable chunks={lastChunks} /></div>}
        {lastUsage && <div className="px-4 pb-2"><CostPanel usage={lastUsage} /></div>}

        <div className="border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleAsk()}
              placeholder="Ask a question about your notes..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? '...' : 'Ask'}
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-300 px-2 text-sm transition-colors"
                title="Clear chat"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
