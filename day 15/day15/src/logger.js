const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const LEVEL_COLORS = {
  DEBUG: COLORS.gray,
  INFO: COLORS.blue,
  WARN: COLORS.yellow,
  ERROR: COLORS.red,
};

export function log(tag, message, level = 'INFO') {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

  const timestamp = new Date().toISOString();
  const color = LEVEL_COLORS[level] || COLORS.reset;
  const tagColor = COLORS.cyan;

  console.log(
    `${COLORS.gray}${timestamp}${COLORS.reset} ${color}[${level}]${COLORS.reset} ${tagColor}[${tag}]${COLORS.reset} ${message}`
  );
}

export function logCost(provider, model, promptTokens, completionTokens, totalTokens) {
  const rates = {
    'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'openai/gpt-4o': { input: 0.0025, output: 0.01 },
    'groq/llama-3.3-70b-versatile': { input: 0.00059, output: 0.00079 },
    'anthropic/claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'anthropic/claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  };

  const key = `${provider}/${model}`;
  const rate = rates[key] || { input: 0.001, output: 0.002 };

  const inputCost = (promptTokens / 1000) * rate.input;
  const outputCost = (completionTokens / 1000) * rate.output;
  const totalCost = inputCost + outputCost;

  log('COST', `Model: ${key} | Input: ${promptTokens} tokens | Output: ${completionTokens} tokens | Total: ${totalTokens} tokens | Cost: $${totalCost.toFixed(6)}`, 'INFO');

  return { promptTokens, completionTokens, totalTokens, totalCost };
}
