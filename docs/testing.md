# Testing Strategy

The AI-First React Framework provides a comprehensive testing strategy with Jest, React Testing Library, and best practices for unit, integration, and end-to-end testing.

## 🧪 Testing Philosophy

### Testing Pyramid
```
        /\
       /  \
      / E2E \
     /______\
    /        \
   /Integration\
  /_____________\
 /               \
/  Unit Tests     \
/__________________\
```

1. **Unit Tests (70%)**: Fast, isolated component and function tests
2. **Integration Tests (20%)**: Component interaction and store integration
3. **End-to-End Tests (10%)**: Full user workflow testing

## ⚙️ Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Setup File
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:3001';

// Mock modules
jest.mock('@services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Global test utilities
global.mockConsole = () => {
  const originalConsole = console;
  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  afterEach(() => {
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
};
```

## 🎨 Component Testing

### Basic Component Test
```typescript
// UserProfile.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from './UserProfile';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg',
};

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockUser.avatar);
  });

  it('handles edit button click', () => {
    const mockOnEdit = jest.fn();
    render(<UserProfile user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it('shows loading state', () => {
    render(<UserProfile user={mockUser} loading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Component with Store
```typescript
// UserList.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { observer } from 'mobx-react-lite';
import { UserStore } from '@stores/UserStore';
import { UserList } from './UserList';

// Mock store
class MockUserStore {
  users = [];
  loading = false;
  error = null;

  fetchUsers = jest.fn();
  deleteUser = jest.fn();
}

// Provider wrapper
const StoreProvider = ({ children, store }) => (
  <div data-store={store}>{children}</div>
);

describe('UserList', () => {
  let mockStore: MockUserStore;

  beforeEach(() => {
    mockStore = new MockUserStore();
  });

  it('displays users when loaded', async () => {
    mockStore.users = [mockUser];
    
    render(
      <StoreProvider store={mockStore}>
        <UserList />
      </StoreProvider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockStore.loading = true;
    
    render(
      <StoreProvider store={mockStore}>
        <UserList />
      </StoreProvider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

## 🗄️ Store Testing

### MobX Store Tests
```typescript
// UserStore.test.ts
import { UserStore } from './UserStore';
import { userService } from '@services/UserService';

jest.mock('@services/UserService');
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    store = new UserStore();
    jest.clearAllMocks();
  });

  describe('fetchUsers', () => {
    it('loads users successfully', async () => {
      const mockUsers = [{ id: '1', name: 'John' }];
      mockUserService.getUsers.mockResolvedValue(mockUsers);

      await store.fetchUsers();

      expect(store.users).toEqual(mockUsers);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('handles fetch error', async () => {
      const error = new Error('Network error');
      mockUserService.getUsers.mockRejectedValue(error);

      await store.fetchUsers();

      expect(store.users).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBe('Network error');
    });

    it('sets loading state during fetch', () => {
      mockUserService.getUsers.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      store.fetchUsers();

      expect(store.loading).toBe(true);
    });
  });

  describe('computed values', () => {
    it('calculates active users correctly', () => {
      store.users = [
        { id: '1', name: 'John', isActive: true },
        { id: '2', name: 'Jane', isActive: false },
        { id: '3', name: 'Bob', isActive: true },
      ];

      expect(store.activeUsers).toHaveLength(2);
      expect(store.activeUsers[0].name).toBe('John');
    });

    it('returns user count', () => {
      store.users = [{ id: '1' }, { id: '2' }];
      expect(store.userCount).toBe(2);
    });
  });
});
```

## 🌐 Service Testing

### API Service Tests
```typescript
// UserService.test.ts
import { UserService } from './UserService';
import { apiClient } from './apiClient';

jest.mock('./apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('fetches users successfully', async () => {
      const mockUsers = [{ id: '1', name: 'John' }];
      mockApiClient.get.mockResolvedValue({ data: mockUsers });

      const result = await service.getUsers();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual(mockUsers);
    });

    it('handles API error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getUsers()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('createUser', () => {
    it('creates user with validation', async () => {
      const userData = { name: 'John', email: 'john@example.com' };
      const createdUser = { id: '1', ...userData };
      
      mockApiClient.post.mockResolvedValue({ data: createdUser });

      const result = await service.createUser(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(createdUser);
    });

    it('validates input data', async () => {
      const invalidData = { name: '', email: 'invalid-email' };

      await expect(service.createUser(invalidData)).rejects.toThrow();
    });
  });
});
```

## 🔗 Integration Testing

### Component + Store Integration
```typescript
// UserManagement.integration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserManagement } from './UserManagement';
import { UserStore } from '@stores/UserStore';
import { userService } from '@services/UserService';

jest.mock('@services/UserService');
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('UserManagement Integration', () => {
  let store: UserStore;

  beforeEach(() => {
    store = new UserStore();
  });

  it('loads and displays users on mount', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];
    
    mockUserService.getUsers.mockResolvedValue(mockUsers);

    render(<UserManagement store={store} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('handles user deletion flow', async () => {
    store.users = [{ id: '1', name: 'John Doe' }];
    mockUserService.deleteUser.mockResolvedValue(undefined);

    render(<UserManagement store={store} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    // Confirm deletion in modal
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('1');
    });
  });

  it('shows error state on fetch failure', async () => {
    mockUserService.getUsers.mockRejectedValue(new Error('Network error'));

    render(<UserManagement store={store} />);

    await waitFor(() => {
      expect(screen.getByText(/error.*network error/i)).toBeInTheDocument();
    });
  });
});
```

## 🎭 Custom Testing Utilities

### Test Utilities
```typescript
// src/test-utils/index.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RootStore } from '@stores/RootStore';

// Store provider wrapper
interface StoreProviderProps {
  children: React.ReactNode;
  store?: RootStore;
}

const StoreProvider: React.FC<StoreProviderProps> = ({ 
  children, 
  store = new RootStore() 
}) => (
  <div data-testid="store-provider" data-store={store}>
    {children}
  </div>
);

// Router wrapper
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</BrowserRouter>
);

// Combined wrapper
const AllProviders: React.FC<{ children: React.ReactNode; store?: RootStore }> = ({ 
  children, 
  store 
}) => (
  <RouterWrapper>
    <StoreProvider store={store}>
      {children}
    </StoreProvider>
  </RouterWrapper>
);

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: RenderOptions & { store?: RootStore }
) => {
  const { store, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => <AllProviders store={store}>{children}</AllProviders>,
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
```

### Mock Factories
```typescript
// src/test-utils/mockFactories.ts
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  isActive: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockStore = () => ({
  userStore: {
    users: [],
    loading: false,
    error: null,
    fetchUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
  authStore: {
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
  },
});

export const createMockApiResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});
```

## 🚀 E2E Testing with Playwright

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example
```typescript
// e2e/user-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('should display user list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByTestId('user-list')).toBeVisible();
  });

  test('should create new user', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('User created successfully')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
  });
});
```

## 📊 Testing Metrics & Reports

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

This comprehensive testing strategy ensures code quality and reliability across your AI-First React applications.