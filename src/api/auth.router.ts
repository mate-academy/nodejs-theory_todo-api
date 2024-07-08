import cookieParser from 'cookie-parser';
import { Router } from 'express';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/registration', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/activation/:email/:token', authController.activate);
authRouter.get('/refresh', cookieParser(), authController.refresh);
authRouter.post('/logout', authController.logout);
