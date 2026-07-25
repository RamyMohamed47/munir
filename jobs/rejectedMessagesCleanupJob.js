import cron from 'node-cron';
import Message from '../models/messageModel.js';
import logger from '../utils/logger.js';

export const REJECTED_MESSAGES_CLEANUP_SCHEDULE = '0 0 * * 5';
export const REJECTED_MESSAGES_CLEANUP_OPTIONS = {
  name: 'rejected-messages-cleanup',
  timezone: 'UTC',
  noOverlap: true,
  unref: true,
};

export const deleteRejectedMessages = async () => {
  const result = await Message.deleteMany({ state: 'Rejected' });

  logger.info(
    {
      event: 'jobs.rejected_messages_cleanup.completed',
      deletedCount: result.deletedCount || 0,
    },
    'Rejected messages cleanup completed',
  );

  return result;
};

export const runRejectedMessagesCleanup = async ({
  runCleanup = deleteRejectedMessages,
  activeLogger = logger,
} = {}) => {
  try {
    return await runCleanup();
  } catch (err) {
    activeLogger.error(
      { err, event: 'jobs.rejected_messages_cleanup.failed' },
      'Rejected messages cleanup failed',
    );
    return null;
  }
};

export const startRejectedMessagesCleanupJob = ({
  enabled = process.env.ENABLE_SCHEDULED_JOBS === 'true',
  runCleanup = deleteRejectedMessages,
  scheduler = cron,
  activeLogger = logger,
} = {}) => {
  if (!enabled) {
    activeLogger.info(
      { event: 'jobs.rejected_messages_cleanup.disabled' },
      'Rejected messages cleanup job disabled',
    );
    return {
      getStatus: () => 'disabled',
      stop: () => {},
    };
  }

  const task = scheduler.schedule(
    REJECTED_MESSAGES_CLEANUP_SCHEDULE,
    () => runRejectedMessagesCleanup({ runCleanup, activeLogger }),
    REJECTED_MESSAGES_CLEANUP_OPTIONS,
  );

  task.on?.('execution:overlap', () => {
    activeLogger.warn(
      { event: 'jobs.rejected_messages_cleanup.skipped_overlap' },
      'Rejected messages cleanup skipped because a previous run is active',
    );
  });

  activeLogger.info(
    {
      event: 'jobs.rejected_messages_cleanup.scheduled',
      schedule: REJECTED_MESSAGES_CLEANUP_SCHEDULE,
      timezone: REJECTED_MESSAGES_CLEANUP_OPTIONS.timezone,
    },
    'Rejected messages cleanup job scheduled',
  );

  return task;
};
