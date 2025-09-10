import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@services/apiClient';
import { userMocks } from './data/userMocks';
import { authMocks } from './data/authMocks';
import { setupUserMocks } from './handlers/userHandlers';
import { setupAuthMocks } from './handlers/authHandlers';

// Check if mocking is enabled via environment variable
const isMockingEnabled = () => {
  return process.env.REACT_APP_USE_MOCK_API === 'true' || 
         process.env.NODE_ENV === 'development';
};

// Create mock instance
let mockInstance: MockAdapter | null = null;

export const setupMocks = () => {
  if (!isMockingEnabled()) {
    console.log('🔗 Using real API endpoints');
    return;
  }

  // Create mock adapter instance
  mockInstance = new MockAdapter(apiClient, { 
    delayResponse: Math.random() * 1000 + 500 // Random delay 500-1500ms
  });

  console.log('🎭 Mock API enabled - using mock data');

  // Setup mock handlers for different domains
  setupAuthMocks(mockInstance);
  setupUserMocks(mockInstance);

  // Log all registered mocks in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Registered mock endpoints:', {
      auth: '/api/auth/*',
      users: '/api/users/*',
    });
  }
};

export const teardownMocks = () => {
  if (mockInstance) {
    mockInstance.restore();
    mockInstance = null;
    console.log('🔄 Mock API disabled');
  }
};

// Export mock data for testing
export { userMocks, authMocks };

// Export for use in tests
export { mockInstance };