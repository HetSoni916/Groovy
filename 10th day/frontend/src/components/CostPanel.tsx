import { TokenUsage } from '../types';

interface Props {
  usage: TokenUsage | null;
}

export default function CostPanel({ usage }: Props) {
  if (!usage || usage.totalTokens === 0) return null;

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-xs text-gray-400">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-medium text-gray-300">{usage.model}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <span className="text-gray-600">Input</span>
          <p className="text-gray-300 font-mono">{usage.inputTokens.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-600">Output</span>
          <p className="text-gray-300 font-mono">{usage.outputTokens.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-600">Total</span>
          <p className="text-gray-300 font-mono">{usage.totalTokens.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-600">Cost</span>
          <p className="text-green-400 font-mono">${usage.cost.toFixed(4)}</p>
        </div>
      </div>
      <div className="mt-1 text-gray-600">
        Response time: {(usage.latencyMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}
