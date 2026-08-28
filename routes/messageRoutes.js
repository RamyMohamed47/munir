import { Router } from 'express';
import { protect, restrictTo } from './../controllers/authController.js';
import {
  createMessage,
  deleteMessage,
  getAllMessages,
  getScheduledMessage,
  setCurrentUserAsMessageUser,
  updateMessage,
} from './../controllers/messageController.js';

const messageRouter = Router();

messageRouter.route('/scheduled-messages').post(protect, getScheduledMessage);

messageRouter
  .route('/')
  .get(protect, restrictTo('admin'), getAllMessages)
  .post(protect, restrictTo('admin'), setCurrentUserAsMessageUser, createMessage);

messageRouter
  .route('/:id')
  .patch(protect, restrictTo('admin'), updateMessage)
  .delete(protect, restrictTo('admin'), deleteMessage);

export default messageRouter;
