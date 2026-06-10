import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const populateMock = jest.fn();
const countDocumentsMock = jest.fn();
const skipMock = jest.fn();
const findOneMock = jest.fn();

await jest.unstable_mockModule('../models/messageModel.js', () => ({
  default: {
    countDocuments: countDocumentsMock,
    findOne: findOneMock,
  },
}));

const { getScheduledMessage } = await import('../controllers/messageController.js');
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('messageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a random approved scheduled message outside the SMI array', async () => {
    const scheduledMessage = {
      message: 'Approved quote',
      shownMessageIndex: 8,
      state: 'Approved',
      user: { name: 'Munir' },
    };

    countDocumentsMock.mockResolvedValue(3);
    populateMock.mockResolvedValue(scheduledMessage);
    skipMock.mockReturnValue({
      populate: populateMock,
    });
    findOneMock.mockReturnValue({
      skip: skipMock,
    });

    const req = {
      body: {
        SMI: [2, 5],
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    getScheduledMessage(req, res, next);
    await flushPromises();

    expect(countDocumentsMock).toHaveBeenCalledWith({
      state: 'Approved',
      shownMessageIndex: { $nin: [2, 5] },
    });
    expect(findOneMock).toHaveBeenCalledWith({
      state: 'Approved',
      shownMessageIndex: { $nin: [2, 5] },
    });
    expect(skipMock).toHaveBeenCalledWith(expect.any(Number));
    expect(populateMock).toHaveBeenCalledWith('user', 'name');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        data: scheduledMessage,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when no scheduled message is available', async () => {
    countDocumentsMock.mockResolvedValue(0);

    const req = {
      body: {
        SMI: [2, 5],
      },
    };
    const res = {};
    const next = jest.fn();

    getScheduledMessage(req, res, next);
    await flushPromises();

    expect(findOneMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      status: 'fail',
    });
  });
});
