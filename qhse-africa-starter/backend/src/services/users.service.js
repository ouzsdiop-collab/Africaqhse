import { prisma } from '../db.js';

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true
};

export async function findAllUsers() {
  return prisma.user.findMany({
    orderBy: [{ name: 'asc' }],
    select: userPublicSelect,
    take: 500
  });
}

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: userPublicSelect
  });
}

export async function createUser({ name, email, role }) {
  return prisma.user.create({
    data: {
      name,
      email,
      role
    },
    select: userPublicSelect
  });
}
