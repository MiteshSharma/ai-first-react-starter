import '@testing-library/jest-dom';

// Mock MobX decorator warnings in tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress MobX warnings in tests
const originalWarn = console.warn;
beforeAll((): void => {
  console.warn = (...args): void => {
    if (typeof args[0] === 'string' && args[0].includes('MobX')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll((): void => {
  console.warn = originalWarn;
});
