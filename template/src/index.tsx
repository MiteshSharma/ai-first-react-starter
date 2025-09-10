import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupMocks } from './mocks';
import { initAllPerformanceMonitoring } from './services/performance';

// Initialize performance monitoring
initAllPerformanceMonitoring();

// Initialize API mocks if enabled
setupMocks();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
