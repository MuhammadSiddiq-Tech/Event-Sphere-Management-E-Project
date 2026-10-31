/**
 * @module server
 * HTTP server bootstrap. Imports createApp and starts listening.
 * Does NOT call listen when NODE_ENV === 'test'.
 */
import http from 'node:http';
import { createApp } from './app.js';
import { logger } from './config/logger.js';
import { env } from './config/env.js';

const server = http.createServer(createApp());

// Track open connections for graceful shutdown
const connections = new Set();
server.on('connection', (socket) => {
  connections.add(socket);
  socket.once('close', () => connections.delete(socket));
});

/**
 * Gracefully shut down the server.
 * @param {string} signal
 */
function shutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal, closing server…');
  server.close(() => {
    logger.info('Server closed cleanly.');
    process.exit(0);
  });
  // Force-close lingering connections after 10 s
  setTimeout(() => {
    for (const socket of connections) socket.destroy();
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Only bind a port outside of test environments
if (process.env.NODE_ENV !== 'test') {
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, `EventSphere server listening on port ${env.PORT}`);
  });
}

export { server };
