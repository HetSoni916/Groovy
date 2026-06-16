import { Document } from '../types';

interface Props {
  documents: Document[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}

export default function Sidebar({ documents, selectedIds, onToggle, onDelete, onUpload, uploading }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white mb-3">Ask My Notes</h2>
        <label className="block w-full cursor-pointer">
          <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" disabled={uploading} />
          <div className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm text-center py-2 rounded-lg font-medium transition-colors">
            {uploading ? 'Uploading...' : '+ Upload PDF'}
          </div>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
          Documents ({documents.length})
        </div>
        {documents.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-8">No PDFs uploaded yet</p>
        )}
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`group rounded-lg p-3 cursor-pointer transition-colors ${
              selectedIds.includes(doc.id) ? 'bg-blue-900/40 border border-blue-700/50' : 'bg-gray-800/50 border border-gray-800 hover:border-gray-700'
            }`}
            onClick={() => onToggle(doc.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate font-medium">{doc.filename}</p>
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                  <span>{doc.totalPages} pages</span>
                  <span>{(doc.totalWords / 1000).toFixed(1)}k words</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-xs px-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {documents.length > 0 && (
        <div className="p-3 border-t border-gray-800 text-xs text-gray-600">
          {selectedIds.length === 0 ? 'Click a document to search within it' : `Searching ${selectedIds.length} document(s)`}
        </div>
      )}
    </div>
  );
}
