import { env } from '@/env';
import { SENSITIVE_KEY } from './redaction';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MAX_DEPTH = 6;

/** Copies `value` for logging: sensitive keys become "[redacted]", errors become plain objects, depth is capped. */
export const redact = (value: unknown, depth = 0): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause === undefined ? {} : { cause: redact(value.cause, depth + 1) }),
    };
  }
  if (value instanceof Date) return value.toISOString();
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[truncated]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : redact(item, depth + 1);
  }
  return out;
};

export interface Logger {
  debug(fields: Record<string, unknown>, message: string): void;
  info(fields: Record<string, unknown>, message: string): void;
  warn(fields: Record<string, unknown>, message: string): void;
  error(fields: Record<string, unknown>, message: string): void;
}

export interface LoggerOptions {
  level: LogLevel;
  /** Receives one JSON line per entry. */
  write: (line: string) => void;
  now?: () => Date;
}

export const createLogger = ({ level, write, now = () => new Date() }: LoggerOptions): Logger => {
  const emit = (at: LogLevel, fields: Record<string, unknown>, message: string): void => {
    if (ORDER[at] < ORDER[level]) return;
    const body = redact(fields) as Record<string, unknown>;
    write(JSON.stringify({ ...body, level: at, time: now().toISOString(), msg: message }));
  };
  return {
    debug: (fields, message) => emit('debug', fields, message),
    info: (fields, message) => emit('info', fields, message),
    warn: (fields, message) => emit('warn', fields, message),
    error: (fields, message) => emit('error', fields, message),
  };
};

/** The process wide logger. LOG_LEVEL comes from the validated environment (undefined while the build skips validation). */
export const log: Logger = createLogger({
  level: env.LOG_LEVEL ?? 'info',
  write: (line) => process.stdout.write(`${line}\n`),
});
