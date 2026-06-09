import { Router } from 'express';
import { protect } from './../controllers/authController.js';
import { getMe } from './../controllers/userController.js';

const userRouter = Router();

userRouter.route('/me').get(protect, getMe);


export default userRouter;
