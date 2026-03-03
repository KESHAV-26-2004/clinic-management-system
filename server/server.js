//server/server.js
const https = require('https');
const net = require('net');
const app = require('./app');
const httpsConfig = require('./config/https');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');

// 🔴 REQUIRED
require("./db/migrate");

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', err => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} already in use`));
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tester.close();
        resolve();
      })
      .listen(port);
  });
}

(async () => {
  try {
    await checkPort(PORT);

    const server = https.createServer(httpsConfig, app);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Clinic server running on https://localhost:${PORT}`);
    });

    process.on("SIGINT", () => {
      logger.warn("Server shutting down (SIGINT)");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      logger.warn("Server shutting down (SIGTERM)");
      process.exit(0);
    });

  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }
})();