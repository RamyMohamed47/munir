import { Router } from 'express';
import userController from './../controllers/userController';
import authController from './../controllers/authController';
import rateLimit from 'express-rate-limit';

const userRouter = Router();

const loginLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many login attempts, please try again later',
    });
  },
});

userRouter.route('/');


export default userRouter;