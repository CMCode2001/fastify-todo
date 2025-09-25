// Configuration Jest pour les tests
process.env.NODE_ENV = 'test';

// Mock console pour éviter les logs pendant les tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};