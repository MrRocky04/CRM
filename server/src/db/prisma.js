import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: process.env.DEBUG_PRISMA ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }
  prisma = global.__db;
}

// Optimize SQLite for instant speed, concurrency and zero-locking stalls
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('file:')) {
  prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;'))
    .then(() => prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'))
    .catch((err) => console.warn('SQLite PRAGMA setup notice:', err.message));
}

export default prisma;
