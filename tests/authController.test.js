import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const verifyIdTokenMock = jest.fn();
const findOneAndUpdateMock = jest.fn();

await jest.unstable_mockModule('../utils/firebaseAdmin.js', () => ({
  getFirebaseAuth: jest.fn(() => ({
    verifyIdToken: verifyIdTokenMock,
  })),
}));

await jest.unstable_mockModule('../models/userModel.js', () => ({
  default: {
    findOneAndUpdate: findOneAndUpdateMock,
  },
}));

const { protect } = await import('../controllers/authController.js');
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('authController', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    findOneAndUpdateMock.mockReset();
  });

  it('verifies the Firebase token and upserts the Mongo user', async () => {
    const mongoUser = {
      _id: 'mongo-user-id',
      name: 'Munir User',
      email: 'munir@example.com',
      firebaseUid: 'firebase-uid-1',
      role: 'user',
    };

    verifyIdTokenMock.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'munir@example.com',
      name: 'Munir User',
    });
    findOneAndUpdateMock.mockResolvedValue(mongoUser);

    const req = {
      headers: {
        authorization: 'Bearer firebase-token',
      },
    };
    const res = {};
    const next = jest.fn();

    protect(req, res, next);
    await flushPromises();

    expect(verifyIdTokenMock).toHaveBeenCalledWith('firebase-token');
    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { firebaseUid: 'firebase-uid-1' },
      {
        name: 'Munir User',
        email: 'munir@example.com',
        firebaseUid: 'firebase-uid-1',
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    expect(req.user).toBe(mongoUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  it('rejects a missing authorization header', async () => {
    const req = {
      headers: {},
    };
    const res = {};
    const next = jest.fn();

    protect(req, res, next);
    await flushPromises();

    expect(verifyIdTokenMock).not.toHaveBeenCalled();
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 401,
      status: 'fail',
    });
  });

  it('rejects an invalid Firebase token', async () => {
    verifyIdTokenMock.mockRejectedValue(new Error('invalid token'));

    const req = {
      headers: {
        authorization: 'Bearer bad-token',
      },
    };
    const res = {};
    const next = jest.fn();

    protect(req, res, next);
    await flushPromises();

    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 401,
      status: 'fail',
    });
  });

  it('rejects incomplete Firebase profile data', async () => {
    verifyIdTokenMock.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'munir@example.com',
    });

    const req = {
      headers: {
        authorization: 'Bearer firebase-token',
      },
    };
    const res = {};
    const next = jest.fn();

    protect(req, res, next);
    await flushPromises();

    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 400,
      status: 'fail',
    });
  });

  it('returns a conflict when the email already exists on another user', async () => {
    verifyIdTokenMock.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'munir@example.com',
      name: 'Munir User',
    });
    findOneAndUpdateMock.mockRejectedValue({
      code: 11000,
      keyValue: {
        email: 'munir@example.com',
      },
    });

    const req = {
      headers: {
        authorization: 'Bearer firebase-token',
      },
    };
    const res = {};
    const next = jest.fn();

    protect(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 409,
      status: 'fail',
    });
  });
});
