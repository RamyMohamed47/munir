import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const populateMock = jest.fn();
const findMock = jest.fn();

await jest.unstable_mockModule('../models/messageModel.js', () => ({
  default: {
    find: findMock,
  },
}));

const { getMessages } = await import('../controllers/messageController.js');

describe('getMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns matched messages populated with the user name', async () => {
    const messages = [
      {
        message: 'Keep going',
        shownMessageIndex: 2,
        user: { name: 'Sara' },
      },
      {
        message: 'Stay focused',
        shownMessageIndex: 5,
        user: { name: 'Omar' },
      },
    ];

    populateMock.mockResolvedValue(messages);
    findMock.mockReturnValue({
      populate: populateMock,
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

    await getMessages(req, res, next);

    expect(findMock).toHaveBeenCalledWith({
      shownMessageIndex: { $in: [2, 5] },
    });
    expect(populateMock).toHaveBeenCalledWith('user', 'name');
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      results: 2,
      data: {
        data: messages,
      },
    });
  });
});
