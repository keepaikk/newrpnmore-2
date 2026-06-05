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
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedHash = process.env.ADMIN_PASSWORD_HASH || '';

  if (username !== expectedUsername) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = expectedHash ? await bcrypt.compare(password, expectedHash) : password === 'admin';
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
