import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const mockUser = {
  _id: 'mongo-user-id',
  name: 'Munir User',
  email: 'munir@example.com',
  firebaseUid: 'firebase-uid-1',
  role: 'user',
};

const mockMessages = [
  {
    _id: 'message-id-1',
    message: 'Message one',
  },
];

const protectMock = jest.fn((req, res, next) => {
  req.user = { ...mockUser };
  next();
});
const restrictToMock = jest.fn(() => (req, res, next) => next());
const authorizeUserMessagesAccessMock = jest.fn((req, res, next) => {
  if (req.user.role === 'admin' || req.user._id === req.params.id) {
    return next();
  }

  return next({
    statusCode: 403,
    status: 'fail',
    message: 'You are not authorized to access these messages',
  });
});
const getAllUsersMock = jest.fn((req, res) => {
  res.status(200).json({
    status: 'success',
    results: 1,
    data: {
      data: [mockUser],
    },
  });
});
const getMeMock = jest.fn((req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      data: req.user,
    },
  });
});
const getStatisticsMock = jest.fn((req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      data: {
        totalUsers: 1,
        totalMessages: 2,
        messagesByState: {
          Approved: 1,
          Pending: 1,
          Rejected: 0,
        },
        totalLikes: 4,
      },
    },
  });
});
const deleteUserMock = jest.fn((req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
const getMessagesByUserIdMock = jest.fn((req, res) => {
  res.status(200).json({
    status: 'success',
    results: mockMessages.length,
    data: {
      data: mockMessages,
    },
  });
});

await jest.unstable_mockModule('../controllers/authController.js', () => ({
  protect: protectMock,
  restrictTo: restrictToMock,
}));

await jest.unstable_mockModule('../controllers/messageController.js', () => ({
  getMessagesByUserId: getMessagesByUserIdMock,
}));

await jest.unstable_mockModule('../controllers/userController.js', () => ({
  authorizeUserMessagesAccess: authorizeUserMessagesAccessMock,
  deleteUser: deleteUserMock,
  getAllUsers: getAllUsersMock,
  getMe: getMeMock,
  getStatistics: getStatisticsMock,
}));

const { default: userRouter } = await import('../routes/userRoutes.js');
const app = express();
app.use(express.json());
app.use('/api/v1/users', userRouter);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
  });
});

describe('user routes', () => {
  beforeEach(() => {
    protectMock.mockClear();
    getAllUsersMock.mockClear();
    getMeMock.mockClear();
    getStatisticsMock.mockClear();
    deleteUserMock.mockClear();
    authorizeUserMessagesAccessMock.mockClear();
    getMessagesByUserIdMock.mockClear();
  });

  it('protects the admin list users route', async () => {
    await request(app)
      .get('/api/v1/users')
      .set('Authorization', 'Bearer firebase-token')
      .expect(200);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(restrictToMock).toHaveBeenCalledWith('admin');
  });

  it('returns the synced Mongo user from the protected route', async () => {
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer firebase-token')
      .expect(200);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        data: mockUser,
      },
    });
  });

  it('protects statistics for admins and returns the expected shape', async () => {
    const response = await request(app)
      .get('/api/v1/users/statistics')
      .set('Authorization', 'Bearer firebase-token')
      .expect(200);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(restrictToMock).toHaveBeenCalledWith('admin');
    expect(getStatisticsMock).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        data: {
          totalUsers: 1,
          totalMessages: 2,
          messagesByState: {
            Approved: 1,
            Pending: 1,
            Rejected: 0,
          },
          totalLikes: 4,
        },
      },
    });
  });

  it('allows a user to access their own messages', async () => {
    const response = await request(app)
      .get(`/api/v1/users/${mockUser._id}/messages`)
      .set('Authorization', 'Bearer firebase-token')
      .expect(200);

    expect(getMessagesByUserIdMock).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({
      status: 'success',
      results: mockMessages.length,
      data: {
        data: mockMessages,
      },
    });
  });

  it('allows an admin to access another user messages', async () => {
    protectMock.mockImplementationOnce((req, res, next) => {
      req.user = { ...mockUser, role: 'admin' };
      next();
    });

    await request(app)
      .get('/api/v1/users/another-user-id/messages')
      .set('Authorization', 'Bearer firebase-token')
      .expect(200);

    expect(getMessagesByUserIdMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a non-admin user accessing another user messages', async () => {
    const response = await request(app)
      .get('/api/v1/users/another-user-id/messages')
      .set('Authorization', 'Bearer firebase-token')
      .expect(403);

    expect(getMessagesByUserIdMock).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      status: 'fail',
      message: 'You are not authorized to access these messages',
    });
  });

  it('protects delete user by id for admins', async () => {
    await request(app)
      .delete('/api/v1/users/user-id-1')
      .set('Authorization', 'Bearer firebase-token')
      .expect(204);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(restrictToMock).toHaveBeenCalledWith('admin');
    expect(deleteUserMock).toHaveBeenCalledTimes(1);
  });
});
