module.exports = {
  testEnvironment: 'node',
  // .js is already treated as ESM when package.json has "type":"module"
  // extensionsToTreatAsEsm is not needed and actually errors on '.js'
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/setup.js'],
};
