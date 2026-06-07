import { Router } from 'express';
import userController from './../controllers/userController';
import messageController from './../controllers/messageController';
import authController from './../controllers/authController';
import rateLimit from 'express-rate-limit';


const messageRouter = Router();


messageRouter.route('/');

export default messageRouter;