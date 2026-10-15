import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { ROLES } from '../config/constants.js';

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Session duration: 7 days
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token: session.token,
    expiresAt: session.expiresAt
  };
}

export async function logout(token) {
  if (!token) return;
  await prisma.session.deleteMany({
    where: { token }
  }).catch(() => {});
}

export async function provisionAdmin(email, password, name = 'CRM Administrator') {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        passwordHash,
        name,
        role: ROLES.ADMIN
      }
    });
    return { user: updated, created: false };
  } else {
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name,
        role: ROLES.ADMIN
      }
    });
    return { user: created, created: true };
  }
}
