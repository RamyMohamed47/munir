import { Router } from 'express';
import { protect, restrictTo } from './../controllers/authController.js';
import { getMessagesByUserId } from './../controllers/messageController.js';
import {
  authorizeUserMessagesAccess,
  deleteUser,
  getAllUsers,
  getMe,
  getStatistics,
} from './../controllers/userController.js';

const userRouter = Router();

userRouter.route('/').get(protect, restrictTo('admin'), getAllUsers);

userRouter.route('/me').get(protect, getMe);
userRouter.route('/statistics').get(protect, restrictTo('admin'), getStatistics);

userRouter
  .route('/:id/messages')
  .get(protect, authorizeUserMessagesAccess, getMessagesByUserId);

userRouter.route('/:id').delete(protect, restrictTo('admin'), deleteUser);


export default userRouter;
