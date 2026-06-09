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

const protectMock = jest.fn((req, res, next) => {
  req.user = mockUser;
  next();
});

await jest.unstable_mockModule('../controllers/authController.js', () => ({
  protect: protectMock,
  restrictTo: jest.fn(),
}));

const { default: userRouter } = await import('../routes/userRoutes.js');
const app = express();
app.use(express.json());
app.use('/api/v1/users', userRouter);

describe('user routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the synced Mongo user from the protected route', async () => {
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer firebase-token')
      .expect(200);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        data: mockUser,
      },
    });
  });
});
