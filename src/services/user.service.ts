import { User } from '@prisma/client';

export type NormalizedUser = ReturnType<typeof normalize>;

function normalize({ id, email }: User) {
  return { id, email };
}

function validateEmail(email: string) {
  const emailPattern = /^[\w.+-]+@([\w-]+\.){1,3}[\w-]{2,}$/;

  if (!email) return 'Email is required';
  if (!emailPattern.test(email)) return 'Email is not valid';
}

function validatePassword(password: string) {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'At least 6 characters';
}

export const userService = {
  normalize,
  validateEmail,
  validatePassword,
};
