import prisma from '../db/prisma.js';

export async function authenticateSession(req, res, next) {
  try {
    const token = req.cookies?.crm_session || req.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      req.user = null;
      req.session = null;
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      if (session) {
        // Expired session cleanup
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      req.user = null;
      req.session = null;
      return next();
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Session authentication error:', error);
    req.user = null;
    req.session = null;
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource.'
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource.'
    });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Administrator privileges are required for this operation.'
    });
  }
  next();
}
