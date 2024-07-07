import { Router } from 'express';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/registration', authController.register);
authRouter.get('/activation/:email/:token', authController.activate);
