import bcrypt from 'bcrypt';
import { RequestHandler, Response } from 'express';
import { usersRepository } from '../entity/users.repository.js';
import { mailer } from '../utils/mailer.js';
import { NormalizedUser, userService } from '../services/user.service.js';
import { jwt } from '../utils/jwt.js';
import { User } from '@prisma/client';
import { tokensRepository } from '../entity/tokens.repository.js';

const register: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const errors = {
    email: userService.validateEmail(email),
    password: userService.validatePassword(password),
  };

  if (Object.values(errors).some(error => error)) {
    return res.status(400).json({
      errors,
      message: 'Validation error',
    });
  }

  const existingUser = await usersRepository.getByEmail(email);

  if (existingUser) {
    return res.status(400).json({
      errors: { email: 'Email is already taken' },
      message: 'Validation error',
    });
  }

  const activationToken = bcrypt.genSaltSync(1);
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await usersRepository.create(
    email,
    hashedPassword,
    activationToken,
  );

  await mailer.sendActivationLink(email, activationToken);

  res.json({
    user: userService.normalize(user),
  });
};

async function sendAuthentication(res: Response, user: User) {
  const userData = userService.normalize(user);
  const accessToken = jwt.generateAccessToken(userData);
  const refreshToken = jwt.generateRefreshToken(userData);

  await tokensRepository.deleteByUserId(user.id);
  await tokensRepository.create(user.id, refreshToken);

  res.cookie('refreshToken', refreshToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });

  res.send({
    user: userData,
    accessToken,
  });
}

const activate: RequestHandler = async (req, res) => {
  const { email, token } = req.params;
  const user = await usersRepository.getByEmail(email);

  if (!user || user.activationToken !== token) {
    return res.status(404);
  }

  await usersRepository.activate(email);

  sendAuthentication(res, user);
};

const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const user = await usersRepository.getByEmail(email);
  const isPasswordValid = await bcrypt.compare(password, user?.password || '');

  if (!user || !isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  sendAuthentication(res, user);
};

const refresh: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || '';
  const userData = jwt.validateRefreshToken(refreshToken) as NormalizedUser;
  const user = await usersRepository.getByEmail(userData?.email || '');
  const token = await tokensRepository.getByToken(refreshToken);

  if (!user || !userData || !token || token.userId !== user.id) {
    res.clearCookie('refreshToken');
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  await sendAuthentication(res, user);
};

const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || '';
  const userData = jwt.validateRefreshToken(refreshToken) as NormalizedUser;

  if (userData) {
    await tokensRepository.deleteByUserId(userData.id);
  }

  res.clearCookie('refreshToken');
  res.sendStatus(204);
};

export const authController = {
  logout,
  refresh,
  login,
  register,
  activate,
};
