# API Mocking System

This document explains the comprehensive API mocking system integrated into the AI-First React Framework templates. The mocking system enables end-to-end testing and development without requiring a backend server.

## Overview

The API mocking system uses `axios-mock-adapter` to intercept HTTP requests and return realistic mock responses. This allows you to:
- Develop and test your frontend without a backend
- Create consistent, repeatable test scenarios  
- Generate realistic data using Faker.js
- Switch seamlessly between mock and real APIs

## Quick Start

### Enable Mock API Mode

```bash
# Start development server with mocks enabled
npm run start:mock

# Or set environment variable
REACT_APP_USE_MOCK_API=true npm start
```

### Disable Mock API Mode

```bash
# Start with real API
npm start

# Or explicitly disable
REACT_APP_USE_MOCK_API=false npm start
```

## System Architecture

### Core Components

1. **Mock Configuration** (`src/mocks/index.ts`)
   - Controls when mocks are enabled/disabled
   - Sets up mock adapter and registers handlers
   - Provides centralized mock management

2. **Data Generators** (`src/mocks/data/`)
   - Generate realistic test data using Faker.js
   - Provide predefined test accounts and entities
   - Handle in-memory data persistence

3. **API Handlers** (`src/mocks/handlers/`)
   - Mock complete REST API endpoints
   - Implement realistic business logic and validation
   - Support pagination, filtering, and search

4. **Generated Service Mocks** (`src/services/__mocks__/`)
   - Auto-generated with service generator
   - Entity-specific mock handlers
   - Consistent with service interface

### Configuration

The mocking system is controlled by environment variables:

```javascript
// Mocks are enabled when:
process.env.REACT_APP_USE_MOCK_API === 'true' || 
process.env.NODE_ENV === 'development'
```

## Generated Service Integration

When you generate a service using the service generator, it automatically creates:

### 1. Service File (`ServiceName.ts`)
```typescript
export class UserService {
  // Standard CRUD operations using apiClient
  public async getUserList(params: UserQueryParams = {}): Promise<UserListResponse> {
    const response = await apiClient.get(`${this.baseUrl}`, { params });
    return response.data;
  }
}
```

### 2. Mock Handlers (`__mocks__/ServiceNameMocks.ts`)
```typescript
// Realistic data generation
export const generateMockUser = (overrides: Partial<MockUser> = {}): MockUser => {
  return {
    id: faker.datatype.uuid(),
    name: faker.name.fullName(),
    email: faker.internet.email(),
    // ... more realistic fields
  };
};

// Complete API endpoint mocking
export const setupUserMocks = (mock: MockAdapter) => {
  // GET /api/users with pagination, filtering, search
  mock.onGet(/\/api\/users(\?.*)?/).reply((config) => {
    // Implementation with realistic pagination and filtering
  });
  
  // POST, PUT, DELETE endpoints...
};
```

### 3. Test Files (`__tests__/ServiceName.test.ts`)
```typescript
describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch user list successfully', async () => {
    // Tests work with both mock and real APIs
  });
});
```

## Mock Features

### Realistic Data Generation

The system uses Faker.js with intelligent field mapping:

```javascript
// Automatic faker selection based on field names
getFakerForType('email', 'string') // → faker.internet.email()
getFakerForType('firstName', 'string') // → faker.name.firstName()
getFakerForType('price', 'number') // → faker.commerce.price()
```

### Complete CRUD Operations

Every generated service includes full REST API mocking:

- **GET** `/api/entities` - List with pagination, search, filtering
- **GET** `/api/entities/:id` - Single entity retrieval
- **POST** `/api/entities` - Create with validation
- **PUT** `/api/entities/:id` - Update with conflict checking
- **DELETE** `/api/entities/:id` - Delete with business rules

### Advanced Features

#### Pagination Support
```javascript
// Request: GET /api/users?page=2&limit=10&search=john
// Response:
{
  data: [...],
  pagination: {
    page: 2,
    limit: 10,
    total: 150,
    totalPages: 15,
    hasNext: true,
    hasPrev: true
  }
}
```

#### Search and Filtering
```javascript
// Search across multiple fields
GET /api/users?search=john
// Filter by status  
GET /api/users?status=active
// Combine filters
GET /api/users?search=john&status=active&role=admin
```

#### Validation and Error Handling
```javascript
// 400 Bad Request - Validation errors
{
  message: "Validation error",
  code: "VALIDATION_ERROR",
  errors: {
    email: "Email is required",
    password: "Password must be at least 8 characters"
  }
}

// 409 Conflict - Duplicate email
{
  message: "Email already exists", 
  code: "EMAIL_CONFLICT",
  email: "user@example.com"
}
```

#### Business Logic
```javascript
// Prevent admin user deletion
if (user.role === 'admin') {
  return [403, {
    message: 'Cannot delete admin users',
    code: 'ADMIN_DELETE_FORBIDDEN'
  }];
}
```

## Customization

### Adding Mock Data

1. **Extend existing data generators:**
```typescript
// In src/mocks/data/userMocks.ts
export const customUsers = [
  generateMockUser({ 
    email: 'test@example.com',
    role: 'admin',
    isActive: true 
  })
];
```

2. **Create new entity mocks:**
```bash
# Generate service with mocks
node generators/service-generator.js ProductService

# Creates:
# - src/services/ProductService.ts
# - src/services/__tests__/ProductService.test.ts  
# - src/services/__mocks__/ProductServiceMocks.ts
```

### Modifying Mock Behavior

Update mock handlers to change API behavior:

```typescript
// Custom validation logic
mock.onPost('/api/products').reply((config) => {
  const data = JSON.parse(config.data);
  
  // Custom business rule
  if (data.price < 0) {
    return [400, { 
      message: 'Price cannot be negative',
      code: 'INVALID_PRICE' 
    }];
  }
  
  // Continue with standard creation...
});
```

## Best Practices

### Development Workflow

1. **Start with mocks enabled** for initial development
2. **Use predefined test accounts** for consistent testing
3. **Switch to real APIs** for integration testing
4. **Keep mock data realistic** to catch edge cases

### Testing Strategy

```typescript
// Write tests that work with both systems
describe('UserService', () => {
  it('handles validation errors correctly', async () => {
    // This test works whether using mocks or real API
    await expect(
      userService.createUser({ email: 'invalid-email' })
    ).rejects.toThrow('Validation error');
  });
});
```

### Mock Data Management

- **Keep mock stores small** - 10-50 items max
- **Use realistic data** - avoid placeholder text
- **Implement proper relationships** between entities
- **Include edge cases** - empty states, errors, etc.

## Environment Configuration

### Development
```env
# .env.development
REACT_APP_USE_MOCK_API=true
REACT_APP_API_URL=http://localhost:3001/api
```

### Production
```env
# .env.production
REACT_APP_USE_MOCK_API=false
REACT_APP_API_URL=https://api.yourdomain.com
```

### Testing
```env
# .env.test
REACT_APP_USE_MOCK_API=true
```

## Troubleshooting

### Common Issues

#### Mocks Not Working
```javascript
// Check environment variable
console.log('Mock API enabled:', process.env.REACT_APP_USE_MOCK_API);

// Verify mock setup
setupMocks(); // Should log "🔄 API mocks enabled"
```

#### Data Not Persisting
- Mock data is stored in memory only
- Refresh resets to initial state
- Use localStorage for persistence if needed

#### Real API Conflicts
```javascript
// Disable mocks completely
process.env.REACT_APP_USE_MOCK_API = 'false';
setupMocks(); // Should log "🌐 Using real API"
```

## Integration Examples

### Authentication Flow
```typescript
// Login with mock credentials
const response = await authService.login({
  email: 'admin@example.com',  // Predefined test account
  password: 'password123'
});

// Returns realistic JWT-like token
console.log(response.token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Data Management
```typescript
// Create user with automatic ID generation
const user = await userService.createUser({
  name: 'John Doe',
  email: 'john@example.com'
});

// Returns: { id: 'uuid-v4', name: 'John Doe', email: 'john@example.com', ... }
```

### Error Handling
```typescript
try {
  await userService.createUser({ email: 'duplicate@example.com' });
} catch (error) {
  // Mock returns proper HTTP status codes and error structures
  console.log(error.message); // "Failed to create User (Status: 409, Details: {...})"
}
```

This mocking system provides a complete development and testing environment that closely mirrors real API behavior while maintaining the flexibility to work offline and create consistent test scenarios.