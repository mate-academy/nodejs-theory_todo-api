import { db } from '../utils/db.js';

export async function getByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function create(
  email: string,
  password: string,
  activationToken?: string,
) {
  return db.user.create({
    data: { email, password, activationToken },
  });
}

export async function activate(email: string) {
  return db.user.update({
    where: { email },
    data: { activationToken: null },
  });
}

export const userRepository = {
  activate,
  getByEmail,
  create,
};
