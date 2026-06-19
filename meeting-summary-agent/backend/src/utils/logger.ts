type LogLevel = 'info' | 'warn' | 'error';

function write(level: LogLevel, event: string, data: Record<string, unknown> = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };

  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
    return;
  }

  if (level === 'warn') {
    console.warn(output);
    return;
  }

  console.log(output);
}

export const logger = {
  info(event: string, data: Record<string, unknown> = {}) {
    write('info', event, data);
  },
  warn(event: string, data: Record<string, unknown> = {}) {
    write('warn', event, data);
  },
  error(event: string, data: Record<string, unknown> = {}) {
    write('error', event, data);
  },
};