import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const deleteManyMock = jest.fn();
const loggerInfoMock = jest.fn();
const loggerWarnMock = jest.fn();
const loggerErrorMock = jest.fn();
const scheduleMock = jest.fn();

await jest.unstable_mockModule('../models/messageModel.js', () => ({
  default: {
    deleteMany: deleteManyMock,
  },
}));

await jest.unstable_mockModule('../utils/logger.js', () => ({
  default: {
    error: loggerErrorMock,
    info: loggerInfoMock,
    warn: loggerWarnMock,
  },
}));

await jest.unstable_mockModule('node-cron', () => ({
  default: {
    schedule: scheduleMock,
  },
}));

const {
  deleteRejectedMessages,
  REJECTED_MESSAGES_CLEANUP_OPTIONS,
  REJECTED_MESSAGES_CLEANUP_SCHEDULE,
  runRejectedMessagesCleanup,
  startRejectedMessagesCleanupJob,
} = await import('../jobs/rejectedMessagesCleanupJob.js');

describe('rejectedMessagesCleanupJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes only rejected messages and logs the deleted count', async () => {
    const deleteResult = { deletedCount: 4 };
    deleteManyMock.mockResolvedValue(deleteResult);

    await expect(deleteRejectedMessages()).resolves.toBe(deleteResult);

    expect(deleteManyMock).toHaveBeenCalledWith({ state: 'Rejected' });
    expect(loggerInfoMock).toHaveBeenCalledWith(
      {
        event: 'jobs.rejected_messages_cleanup.completed',
        deletedCount: 4,
      },
      'Rejected messages cleanup completed',
    );
  });

  it('does not schedule when the env flag is disabled', () => {
    const job = startRejectedMessagesCleanupJob({
      enabled: false,
    });

    expect(scheduleMock).not.toHaveBeenCalled();
    expect(job.getStatus()).toBe('disabled');
    expect(loggerInfoMock).toHaveBeenCalledWith(
      { event: 'jobs.rejected_messages_cleanup.disabled' },
      'Rejected messages cleanup job disabled',
    );
  });

  it('schedules cleanup for Friday at 00:00 UTC with overlap protection', () => {
    const task = {
      on: jest.fn(),
      stop: jest.fn(),
    };
    const runCleanupMock = jest.fn();
    scheduleMock.mockReturnValue(task);

    const returnedTask = startRejectedMessagesCleanupJob({
      enabled: true,
      runCleanup: runCleanupMock,
    });

    expect(scheduleMock).toHaveBeenCalledWith(
      REJECTED_MESSAGES_CLEANUP_SCHEDULE,
      expect.any(Function),
      REJECTED_MESSAGES_CLEANUP_OPTIONS,
    );
    expect(task.on).toHaveBeenCalledWith(
      'execution:overlap',
      expect.any(Function),
    );
    expect(returnedTask).toBe(task);
    expect(loggerInfoMock).toHaveBeenCalledWith(
      {
        event: 'jobs.rejected_messages_cleanup.scheduled',
        schedule: REJECTED_MESSAGES_CLEANUP_SCHEDULE,
        timezone: 'UTC',
      },
      'Rejected messages cleanup job scheduled',
    );
  });

  it('runs cleanup from the scheduled task', async () => {
    const task = {
      on: jest.fn(),
    };
    const runCleanupMock = jest.fn().mockResolvedValue({ deletedCount: 2 });
    scheduleMock.mockReturnValue(task);

    startRejectedMessagesCleanupJob({
      enabled: true,
      runCleanup: runCleanupMock,
    });

    await scheduleMock.mock.calls[0][1]();

    expect(runCleanupMock).toHaveBeenCalledTimes(1);
  });

  it('logs cleanup failures without throwing', async () => {
    const runCleanupMock = jest.fn().mockRejectedValue(new Error('delete failed'));

    await expect(
      runRejectedMessagesCleanup({ runCleanup: runCleanupMock }),
    ).resolves.toBeNull();

    expect(runCleanupMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      {
        err: expect.any(Error),
        event: 'jobs.rejected_messages_cleanup.failed',
      },
      'Rejected messages cleanup failed',
    );
  });
});
