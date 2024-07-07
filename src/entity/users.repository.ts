import { db } from '../utils/db.js';

function getByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

function create(email: string, password: string, activationToken?: string) {
  return db.user.create({
    data: { email, password, activationToken },
  });
}

function activate(email: string) {
  return db.user.update({
    where: { email },
    data: { activationToken: null },
  });
}

function getAllActive() {
  return db.user.findMany({
    where: { activationToken: null },
  });
}

export const usersRepository = {
  getAllActive,
  activate,
  getByEmail,
  create,
};
