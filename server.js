import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { startRejectedMessagesCleanupJob } from './jobs/rejectedMessagesCleanupJob.js';

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

import app from './app.js';

const dB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

let rejectedMessagesCleanupJob;

mongoose.connect(dB).then(() => {
  logger.info({ event: 'db.connected' }, 'DB connection successful');
  rejectedMessagesCleanupJob = startRejectedMessagesCleanupJob();
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  logger.info(
    {
      event: 'server.started',
      port,
      env: process.env.NODE_ENV || 'development',
    },
    'Server listening',
  );
});

process.on('unhandledRejection', (err) => {
  console.error(err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info(
    { event: 'process.sigterm' },
    'SIGTERM received. Shutting down gracefully.',
  );
  rejectedMessagesCleanupJob?.stop();
  server.close(() => {
    logger.info({ event: 'process.terminated' }, 'Process terminated');
  });
});
