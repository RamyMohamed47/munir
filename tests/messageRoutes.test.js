import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const protectMock = jest.fn((req, res, next) => {
  req.user = {
    _id: 'admin-user-id',
    role: 'admin',
  };
  next();
});
const restrictToMock = jest.fn(() => (req, res, next) => next());
const getScheduledMessageMock = jest.fn((req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      data: {
        _id: 'scheduled-message-id',
      },
    },
  });
});
const getAllMessagesMock = jest.fn((req, res) => {
  res.status(200).json({
    status: 'success',
    results: 0,
    data: {
      data: [],
    },
  });
});
const setCurrentUserAsMessageUserMock = jest.fn((req, res, next) => next());
const createMessageMock = jest.fn((req, res) => {
  res.status(201).json({
    status: 'success',
    data: {
      data: {
        _id: 'message-id-1',
      },
    },
  });
});
const updateMessageMock = jest.fn((req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      data: {
        _id: req.params.id,
      },
    },
  });
});
const deleteMessageMock = jest.fn((req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

await jest.unstable_mockModule('../controllers/authController.js', () => ({
  protect: protectMock,
  restrictTo: restrictToMock,
}));

await jest.unstable_mockModule('../controllers/messageController.js', () => ({
  createMessage: createMessageMock,
  deleteMessage: deleteMessageMock,
  getAllMessages: getAllMessagesMock,
  getScheduledMessage: getScheduledMessageMock,
  setCurrentUserAsMessageUser: setCurrentUserAsMessageUserMock,
  updateMessage: updateMessageMock,
}));

const { default: messageRouter } = await import('../routes/messageRoutes.js');
const app = express();
app.use(express.json());
app.use('/api/v1/messages', messageRouter);

describe('message routes', () => {
  beforeEach(() => {
    protectMock.mockClear();
    getScheduledMessageMock.mockClear();
    getAllMessagesMock.mockClear();
    setCurrentUserAsMessageUserMock.mockClear();
    createMessageMock.mockClear();
    updateMessageMock.mockClear();
    deleteMessageMock.mockClear();
  });

  it('protects scheduled-messages requests for authenticated users', async () => {
    await request(app)
      .get('/api/v1/messages/scheduled-messages')
      .set('Authorization', 'Bearer firebase-token')
      .send({ SMI: [1, 2] })
      .expect(200);

    expect(getScheduledMessageMock).toHaveBeenCalledTimes(1);
    expect(protectMock).toHaveBeenCalledTimes(1);
  });

  it('protects admin get all messages', async () => {
    await request(app)
      .get('/api/v1/messages')
      .set('Authorization', 'Bearer firebase-token')
      .expect(200);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(restrictToMock).toHaveBeenCalledWith('admin');
    expect(getAllMessagesMock).toHaveBeenCalledTimes(1);
  });

  it('protects admin create message and sets current user', async () => {
    await request(app)
      .post('/api/v1/messages')
      .set('Authorization', 'Bearer firebase-token')
      .send({ message: 'New message' })
      .expect(201);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(restrictToMock).toHaveBeenCalledWith('admin');
    expect(setCurrentUserAsMessageUserMock).toHaveBeenCalledTimes(1);
    expect(createMessageMock).toHaveBeenCalledTimes(1);
  });

  it('protects admin update message', async () => {
    await request(app)
      .patch('/api/v1/messages/message-id-1')
      .set('Authorization', 'Bearer firebase-token')
      .send({ state: 'Approved' })
      .expect(200);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(restrictToMock).toHaveBeenCalledWith('admin');
    expect(updateMessageMock).toHaveBeenCalledTimes(1);
  });

  it('protects admin delete message', async () => {
    await request(app)
      .delete('/api/v1/messages/message-id-1')
      .set('Authorization', 'Bearer firebase-token')
      .expect(204);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(restrictToMock).toHaveBeenCalledWith('admin');
    expect(deleteMessageMock).toHaveBeenCalledTimes(1);
  });
});
