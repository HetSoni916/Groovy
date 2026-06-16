import { Source } from '../types';
import { useState } from 'react';

interface Props {
  question: string;
  answer: string;
  sources: Source[];
  isUser?: boolean;
}

export default function ChatMessage({ question, answer, sources, isUser }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-1'}`}>
        {isUser ? (
          <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">
            {question}
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
            <div className="prose prose-invert prose-sm max-w-none text-gray-200 whitespace-pre-wrap">
              {answer}
            </div>

            {sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 font-semibold mb-1">Sources:</p>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((s, i) => (
                    <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                      {s.filename} — Page {s.pageNumber}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
