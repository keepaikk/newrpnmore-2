import bcrypt from 'bcryptjs';

export function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

export function requireAuthPage(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.redirect('/admin/login.html');
}

export async function loginHandler(req, res) {
  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  const expectedPlain = process.env.ADMIN_PASSWORD; // temporary plain-text fallback

  // Require at least username + one form of password
  if (!expectedUsername || (!expectedHash && !expectedPlain)) {
    console.error('[Auth] ADMIN_USERNAME or ADMIN_PASSWORD_HASH not set');
    return res.status(503).json({ error: 'Authentication not configured' });
  }

  if (username !== expectedUsername) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  let valid = false;
  if (expectedHash) {
    valid = await bcrypt.compare(password, expectedHash);
  } else if (expectedPlain) {
    console.warn('[Auth] Using plain-text ADMIN_PASSWORD — set ADMIN_PASSWORD_HASH for production');
    valid = password === expectedPlain;
  }

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.authenticated = true;
  req.session.username = username;
  return res.json({ success: true });
}

export function logoutHandler(req, res) {
  req.session.destroy(() => {
    res.json({ success: true });
  });
}
