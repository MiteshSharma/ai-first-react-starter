import MockAdapter from 'axios-mock-adapter';
import { 
  authMocks,
  validateCredentials,
  generateAuthResponse,
  storeRefreshToken,
  isValidRefreshToken,
  removeRefreshToken,
  authErrors,
  type MockLoginCredentials 
} from '../data/authMocks';

export const setupAuthMocks = (mock: MockAdapter) => {
  // POST /api/auth/login - User login
  mock.onPost('/api/auth/login').reply((config) => {
    try {
      const credentials: MockLoginCredentials = JSON.parse(config.data);
      
      // Validate required fields
      if (!credentials.email || !credentials.password) {
        return [400, {
          message: 'Email and password are required',
          code: 'VALIDATION_ERROR',
          errors: {
            email: !credentials.email ? 'Email is required' : null,
            password: !credentials.password ? 'Password is required' : null,
          }
        }];
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        return [400, {
          message: 'Invalid email format',
          code: 'INVALID_EMAIL'
        }];
      }

      // Validate credentials
      const user = validateCredentials(credentials);
      if (!user) {
        return [401, {
          message: authErrors.invalidCredentials.message,
          code: authErrors.invalidCredentials.code
        }];
      }

      // Check if user is active
      if (!user.isActive) {
        return [403, {
          message: authErrors.accountInactive.message,
          code: authErrors.accountInactive.code
        }];
      }

      // Generate auth response
      const authResponse = generateAuthResponse(user);
      
      // Store refresh token
      storeRefreshToken(authResponse.refreshToken);

      return [200, {
        data: authResponse,
        message: 'Login successful'
      }];
    } catch (error) {
      return [400, {
        message: 'Invalid JSON data',
        code: 'INVALID_JSON'
      }];
    }
  });

  // POST /api/auth/logout - User logout
  mock.onPost('/api/auth/logout').reply((config) => {
    try {
      const { refreshToken } = JSON.parse(config.data);
      
      if (refreshToken) {
        removeRefreshToken(refreshToken);
      }

      return [200, {
        message: 'Logout successful'
      }];
    } catch (error) {
      // Even if there's an error parsing, logout should succeed
      return [200, {
        message: 'Logout successful'
      }];
    }
  });

  // POST /api/auth/refresh - Refresh access token
  mock.onPost('/api/auth/refresh').reply((config) => {
    try {
      const { refreshToken } = JSON.parse(config.data);
      
      if (!refreshToken) {
        return [400, {
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        }];
      }

      if (!isValidRefreshToken(refreshToken)) {
        return [401, {
          message: authErrors.invalidToken.message,
          code: authErrors.invalidToken.code
        }];
      }

      // For demo purposes, we'll use the admin user for refresh
      // In a real app, you'd decode the refresh token to get user info
      const user = authMocks.credentials.admin.user;
      const newAuthResponse = generateAuthResponse(user);
      
      // Remove old refresh token and store new one
      removeRefreshToken(refreshToken);
      storeRefreshToken(newAuthResponse.refreshToken);

      return [200, {
        data: {
          token: newAuthResponse.token,
          refreshToken: newAuthResponse.refreshToken,
          expiresIn: newAuthResponse.expiresIn,
        },
        message: 'Token refreshed successfully'
      }];
    } catch (error) {
      return [400, {
        message: 'Invalid JSON data',
        code: 'INVALID_JSON'
      }];
    }
  });

  // GET /api/auth/me - Get current user info
  mock.onGet('/api/auth/me').reply((config) => {
    // Check for Authorization header
    const authHeader = config.headers?.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return [401, {
        message: 'Authorization token is required',
        code: 'MISSING_TOKEN'
      }];
    }

    const token = authHeader.split(' ')[1];
    
    // Basic token validation (in real app, you'd verify JWT signature)
    if (!token || token.length < 10) {
      return [401, {
        message: authErrors.invalidToken.message,
        code: authErrors.invalidToken.code
      }];
    }

    // For demo, return admin user info
    // In real app, you'd decode the token to get user ID
    const user = authMocks.credentials.admin.user;

    return [200, {
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
      }
    }];
  });

  // POST /api/auth/forgot-password - Forgot password
  mock.onPost('/api/auth/forgot-password').reply((config) => {
    try {
      const { email } = JSON.parse(config.data);
      
      if (!email) {
        return [400, {
          message: 'Email is required',
          code: 'VALIDATION_ERROR'
        }];
      }

      // Check if user exists (but don't reveal if they don't for security)
      const userExists = Object.values(authMocks.credentials).some(
        cred => cred.email === email
      );

      // Always return success for security (don't reveal if email exists)
      return [200, {
        message: 'If an account with this email exists, you will receive a password reset link.',
        data: {
          email,
          resetTokenSent: userExists, // This wouldn't be returned in real app
        }
      }];
    } catch (error) {
      return [400, {
        message: 'Invalid JSON data',
        code: 'INVALID_JSON'
      }];
    }
  });

  // POST /api/auth/reset-password - Reset password
  mock.onPost('/api/auth/reset-password').reply((config) => {
    try {
      const { token, newPassword, confirmPassword } = JSON.parse(config.data);
      
      // Validate required fields
      if (!token || !newPassword || !confirmPassword) {
        return [400, {
          message: 'All fields are required',
          code: 'VALIDATION_ERROR',
          errors: {
            token: !token ? 'Reset token is required' : null,
            newPassword: !newPassword ? 'New password is required' : null,
            confirmPassword: !confirmPassword ? 'Password confirmation is required' : null,
          }
        }];
      }

      // Validate password match
      if (newPassword !== confirmPassword) {
        return [400, {
          message: 'Passwords do not match',
          code: 'PASSWORD_MISMATCH'
        }];
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return [400, {
          message: 'Password must be at least 8 characters long',
          code: 'WEAK_PASSWORD'
        }];
      }

      // Validate reset token (for demo, accept any token longer than 10 chars)
      if (token.length < 10) {
        return [400, {
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        }];
      }

      return [200, {
        message: 'Password reset successful. You can now login with your new password.'
      }];
    } catch (error) {
      return [400, {
        message: 'Invalid JSON data',
        code: 'INVALID_JSON'
      }];
    }
  });

  // POST /api/auth/change-password - Change password (authenticated)
  mock.onPost('/api/auth/change-password').reply((config) => {
    // Check authorization
    const authHeader = config.headers?.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return [401, {
        message: 'Authorization token is required',
        code: 'MISSING_TOKEN'
      }];
    }

    try {
      const { currentPassword, newPassword, confirmPassword } = JSON.parse(config.data);
      
      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return [400, {
          message: 'All fields are required',
          code: 'VALIDATION_ERROR'
        }];
      }

      // Validate password match
      if (newPassword !== confirmPassword) {
        return [400, {
          message: 'New passwords do not match',
          code: 'PASSWORD_MISMATCH'
        }];
      }

      // For demo, assume current password is always valid
      // In real app, you'd verify against stored hash

      return [200, {
        message: 'Password changed successfully'
      }];
    } catch (error) {
      return [400, {
        message: 'Invalid JSON data',
        code: 'INVALID_JSON'
      }];
    }
  });

  console.log('🔐 Auth API mocks registered');
};