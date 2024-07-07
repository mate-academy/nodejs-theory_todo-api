import bcrypt from 'bcrypt';
import { RequestHandler } from 'express';
import { userRepository } from '../entity/user.repository.js';
import { mailer } from '../utils/mailer.js';

function validateEmail(email: string) {
  const emailPattern = /^[\w.+-]+@([\w-]+\.){1,3}[\w-]{2,}$/;

  if (!email) return 'Email is required';
  if (!emailPattern.test(email)) return 'Email is not valid';
}

function validatePassword(password: string) {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'At least 6 characters';
}

export const register: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };

  if (Object.values(errors).some(error => error)) {
    return res.status(400).json({
      errors,
      message: 'Validation error',
    });
  }

  const existingUser = await userRepository.getByEmail(email);

  if (existingUser) {
    return res.status(400).json({
      errors: { email: 'Email is already taken' },
      message: 'Validation error',
    });
  }

  const activationToken = bcrypt.genSaltSync(1);
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create(
    email,
    hashedPassword,
    activationToken,
  );

  await mailer.sendActivationLink(email, activationToken);

  res.status(201).json({ user });
};

export const activate: RequestHandler = async (req, res) => {
  const { email, token } = req.params;
  const user = await userRepository.getByEmail(email);

  if (!user || user.activationToken !== token) {
    return res.status(404);
  }

  await userRepository.activate(email);

  res.json({ message: 'Account activated' });
};

export const authController = {
  register,
  activate,
};
