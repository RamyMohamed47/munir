import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import { join } from 'path';
import pino, { destination, stdTimeFunctions, multistream } from 'pino';
import pretty from 'pino-pretty';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = join(__dirname, '..', 'logs');
const LOG_FILE = join(LOG_DIR, 'app.log');

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers.set-cookie',
  '*.password',
  '*.passwordConfirm',
  '*.passwordCurrent',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.jwt',
  '*.code',
  '*.state',
  '*.stripe-signature',
  '*.passwordResetToken',
  'authorization',
  'cookie',
  'set-cookie',
];

const getLogLevel = () => {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    return 'silent';
  }
  if (process.env.NODE_ENV === 'production') return 'info';
  return 'debug';
};

const createStreams = () => {
  if (getLogLevel() === 'silent') {
    return [
      {
        stream: destination({
          dest: process.platform === 'win32' ? 'NUL' : '/dev/null',
        }),
      },
    ];
  }

  mkdirSync(LOG_DIR, { recursive: true });

  const streams = [
    {
      stream:
        process.env.NODE_ENV === 'production'
          ? process.stdout
          : pretty({
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            }),
    },
    {
      stream: destination({
        dest: LOG_FILE,
        // Use synchronous destination in production so pino.final can flush safely
        sync: process.env.NODE_ENV === 'production',
      }),
    },
  ];

  return streams;
};

const logger = pino(
  {
    level: getLogLevel(),
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    base: {
      service: 'natours',
      env: process.env.NODE_ENV || 'development',
    },
    timestamp: stdTimeFunctions.isoTime,
  },
  multistream(createStreams()),
);

export default logger;
const _REDACT_PATHS = REDACT_PATHS;
export { _REDACT_PATHS as REDACT_PATHS };
const _LOG_FILE = LOG_FILE;
export { _LOG_FILE as LOG_FILE };
