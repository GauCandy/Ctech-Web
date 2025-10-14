// Ghi chu: Middleware kiem tra token nguoi dung truoc khi cho phep truy cap API.
const { authenticateRequest } = require('../services/sessionService');

// Chi yeu cau dang nhap, du moi vai tro.
async function requireUserAuth(req, res, next) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.auth = auth;
    return next();
  } catch (error) {
    return next(error);
  }
}

// Chi cho phep nguoi dung co vai tro admin.
async function requireAdminAuth(req, res, next) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    if (auth.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required.' });
    }

    req.auth = auth;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireUserAuth,
  requireAdminAuth,
};
