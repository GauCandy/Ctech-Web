// Ghi chu: Tao ung dung Express va dang ky cac router API chinh.
const express = require('express');
const path = require('path');
const { pool } = require('../database/connection');
const { authRouter } = require('../api/features/auth/router');
const { adminRouter } = require('../api/features/admin/router');
const { servicesRouter } = require('../api/features/services/router');
const { chatbotRouter } = require('../api/features/chatbot/router');

function createApp() {
  const app = express();
  const startedAt = new Date();
  const frontendDir = path.join(__dirname, '..', '..', 'frontend');

  // Cau hinh CORS co ban va xu ly preflight.
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());
  app.use(express.static(frontendDir));

  // Trang web tam thoi.
  app.get('/', (req, res) => {
    res.redirect(302, '/home');
  });

  app.get('/home', (req, res) => {
    res.sendFile(path.join(frontendDir, 'main.html'));
  });

  app.get('/login', (req, res) => {
    res.sendFile(path.join(frontendDir, 'login.html'));
  });

  app.get('/services', (req, res) => {
    res.sendFile(path.join(frontendDir, 'services.html'));
  });

  // Endpoint suc khoe he thong va database.
  app.get('/api/status', async (req, res) => {
    const uptimeSeconds = Number(process.uptime().toFixed(3));
    const status = {
      status: 'ok',
      uptime: {
        seconds: uptimeSeconds,
        startedAt: startedAt.toISOString(),
      },
      database: {
        connected: true,
      },
      timestamp: new Date().toISOString(),
    };

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.ping();
    } catch (error) {
      status.status = 'degraded';
      status.database.connected = false;
      status.database.error = error.message;
    } finally {
      if (connection) {
        connection.release();
      }
    }

    res.json(status);
  });

  // Dang ky cac router chinh.
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/chatbot', chatbotRouter);

  // Mac dinh tra ve giao dien frontend cho cac GET path (tru /api) neu chua duoc khai bao.
  app.get(/^\/(?!api).*/, (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    res.sendFile(path.join(frontendDir, 'main.html'));
  });

  // Xu ly 404 mac dinh.
  app.use((req, res) => {
    res.status(404).json({ error: 'Resource not found.' });
  });

  // Xu ly loi tong quang.
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

function startServer({ port }) {
  const app = createApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

module.exports = {
  startServer,
};
