import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });
const logger = require('./utils/logger');

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

import app from './app.js';

const dB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(dB).then(() => {
  logger.info({ event: 'db.connected' }, 'DB connection successful');
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
  server.close(() => {
    logger.info({ event: 'process.terminated' }, 'Process terminated');
  });
});