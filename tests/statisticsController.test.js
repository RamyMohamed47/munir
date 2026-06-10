import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const userCountDocumentsMock = jest.fn();
const messageCountDocumentsMock = jest.fn();
const aggregateMock = jest.fn();

await jest.unstable_mockModule('../models/userModel.js', () => ({
  default: {
    countDocuments: userCountDocumentsMock,
  },
}));

await jest.unstable_mockModule('../models/messageModel.js', () => ({
  default: {
    aggregate: aggregateMock,
    countDocuments: messageCountDocumentsMock,
  },
}));

const { getStatistics } = await import('../controllers/userController.js');
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('userController.getStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the expected statistics payload', async () => {
    userCountDocumentsMock.mockResolvedValue(5);
    messageCountDocumentsMock.mockResolvedValue(12);
    aggregateMock
      .mockResolvedValueOnce([{ totalLikes: 30 }])
      .mockResolvedValueOnce([
        { _id: 'Approved', count: 7 },
        { _id: 'Pending', count: 3 },
        { _id: 'Rejected', count: 2 },
      ]);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    getStatistics(req, res);
    await flushPromises();

    expect(userCountDocumentsMock).toHaveBeenCalledTimes(1);
    expect(messageCountDocumentsMock).toHaveBeenCalledTimes(1);
    expect(aggregateMock).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        data: {
          totalUsers: 5,
          totalMessages: 12,
          messagesByState: {
            Approved: 7,
            Pending: 3,
            Rejected: 2,
          },
          totalLikes: 30,
        },
      },
    });
  });
});
