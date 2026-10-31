// Set required environment variables BEFORE any module import.
// env.js reads process.env at module evaluation time and calls process.exit(1) on failure.
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGO_URI = 'mongodb://localhost:27017/eventsphere-test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-16ch';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-16c';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '7d';
process.env.BCRYPT_ROUNDS = '10';
process.env.LOG_LEVEL = 'silent';
