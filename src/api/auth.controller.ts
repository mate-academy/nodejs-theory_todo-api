import bcrypt from 'bcrypt';
import { RequestHandler } from 'express';
import { usersRepository } from '../entity/users.repository.js';
import { mailer } from '../utils/mailer.js';
import { userService } from '../services/user.service.js';
import { jwt } from '../utils/jwt.js';

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

  res.status(201).json({
    user: userService.normalize(user),
  });
};

const activate: RequestHandler = async (req, res) => {
  const { email, token } = req.params;
  const user = await usersRepository.getByEmail(email);

  if (!user || user.activationToken !== token) {
    return res.status(404);
  }

  await usersRepository.activate(email);

  const normalizedUser = userService.normalize(user);

  res.status(201).json({
    user: normalizedUser,
    accessToken: jwt.generateAccessToken(normalizedUser),
  });
};

const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const user = await usersRepository.getByEmail(email);
  const isPasswordValid = await bcrypt.compare(password, user?.password || '');

  if (!user || !isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const normalizedUser = userService.normalize(user);

  res.status(201).json({
    user: normalizedUser,
    accessToken: jwt.generateAccessToken(normalizedUser),
  });
};

export const authController = {
  login,
  register,
  activate,
};
