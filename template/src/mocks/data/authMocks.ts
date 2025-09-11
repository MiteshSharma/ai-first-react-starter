import { faker } from '@faker-js/faker';
import { userMocks } from './userMocks';

export interface MockAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MockLoginCredentials {
  email: string;
  password: string;
}

// Generate JWT-like token (not real JWT, just for mocking)
const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  }));
  const signature = btoa(faker.string.uuid());
  
  return `${header}.${payload}.${signature}`;
};

// Mock user credentials for testing
export const mockCredentials = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    user: userMocks.admin,
  },
  user: {
    email: 'john.doe@example.com',
    password: 'user123',
    user: userMocks.user,
  },
  // Additional test users
  moderator: {
    email: 'moderator@example.com',
    password: 'mod123',
    user: {
      id: 'moderator-user-1',
      name: 'Jane Moderator',
      email: 'moderator@example.com',
      role: 'moderator',
      isActive: true,
      avatar: faker.image.avatar(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    },
  },
};

// Simulate login validation
export const validateCredentials = (credentials: MockLoginCredentials) => {
  const { email, password } = credentials;
  
  // Find matching credentials
  const matchedCredential = Object.values(mockCredentials).find(
    cred => cred.email === email && cred.password === password
  );
  
  if (!matchedCredential) {
    return null;
  }
  
  return matchedCredential.user;
};

// Generate auth response
export const generateAuthResponse = (user: any): MockAuthResponse => {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    token: generateMockToken(user.id),
    refreshToken: generateMockToken(`refresh_${user.id}`),
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
  };
};

// Auth error responses
export const authErrors = {
  invalidCredentials: {
    message: 'Invalid email or password',
    code: 'INVALID_CREDENTIALS',
  },
  userNotFound: {
    message: 'User not found',
    code: 'USER_NOT_FOUND',
  },
  accountInactive: {
    message: 'Account is inactive. Please contact support.',
    code: 'ACCOUNT_INACTIVE',
  },
  tokenExpired: {
    message: 'Token has expired',
    code: 'TOKEN_EXPIRED',
  },
  invalidToken: {
    message: 'Invalid or malformed token',
    code: 'INVALID_TOKEN',
  },
};

// Mock refresh token storage (in-memory for demo)
const refreshTokenStore = new Set<string>();

export const storeRefreshToken = (token: string) => {
  refreshTokenStore.add(token);
};

export const isValidRefreshToken = (token: string): boolean => {
  return refreshTokenStore.has(token);
};

export const removeRefreshToken = (token: string) => {
  refreshTokenStore.delete(token);
};

// Export main auth mocks object
export const authMocks = {
  credentials: mockCredentials,
  errors: authErrors,
  validateCredentials,
  generateAuthResponse,
  storeRefreshToken,
  isValidRefreshToken,
  removeRefreshToken,
};