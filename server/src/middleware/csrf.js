import crypto from 'crypto';

export function csrfProtection(req, res, next) {
  // 1. Bypass CSRF for inbound webhooks (authenticated via cryptographic signatures)
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }

  // 2. Ensure CSRF cookie exists
  let token = req.cookies?.crm_csrf_token;
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie('crm_csrf_token', token, {
      httpOnly: false, // Accessible by JavaScript client to send in header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }

  // Set CSRF token in response header for convenience
  res.setHeader('X-CSRF-Token', token);

  // 3. Safe methods don't require CSRF validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 4. Initial login can proceed if csrf cookie was just established or matched
  if (req.path === '/api/auth/login') {
    return next();
  }

  // 5. For state-changing operations, validate header
  const headerToken = req.headers['x-csrf-token'];
  if (!headerToken || headerToken !== token) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'State-changing requests require a valid X-CSRF-Token header.'
    });
  }

  next();
}
