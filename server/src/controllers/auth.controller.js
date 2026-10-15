import * as authService from '../services/auth.service.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Set secure HTTP-only cookie
    res.cookie('crm_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt
    });

    res.json({
      message: 'Login successful',
      user: result.user
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.crm_session || req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    await authService.logout(token);

    res.clearCookie('crm_session', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  res.json({ user: req.user });
}

export async function getCsrfToken(req, res) {
  const token = req.cookies?.crm_csrf_token || res.getHeader('X-CSRF-Token');
  res.json({ csrfToken: token });
}
