import { Router } from 'express';
import { getMessages } from './../controllers/messageController.js';

const messageRouter = Router();

messageRouter.route('/').get(getMessages);

export default messageRouter;
