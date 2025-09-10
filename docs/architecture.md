# Architecture Overview

The AI-First React Framework is designed with a modern, scalable architecture that promotes maintainability, testability, and developer productivity. This document outlines the key architectural decisions and patterns used throughout the framework.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI-First React Framework                 │
├─────────────────────────────────────────────────────────────┤
│  🎨 Presentation Layer                                      │
│  ├── React Components (Functional + Hooks)                 │
│  ├── Styled Components + Ant Design                        │
│  ├── Pages & Routing                                       │
│  └── UI State Management                                   │
├─────────────────────────────────────────────────────────────┤
│  🧠 State Management Layer                                  │
│  ├── MobX Stores (Business Logic)                          │
│  ├── Computed Values                                       │
│  ├── Actions & Reactions                                   │
│  └── Store Composition                                     │
├─────────────────────────────────────────────────────────────┤
│  🌐 Service Layer                                           │
│  ├── API Services (HTTP Client)                            │
│  ├── Data Fetching (SWR)                                   │
│  ├── Validation (Zod Schemas)                              │
│  └── Error Handling                                        │
├─────────────────────────────────────────────────────────────┤
│  🛠️ Infrastructure Layer                                    │
│  ├── Build System (Craco + Webpack)                        │
│  ├── TypeScript Configuration                              │
│  ├── Testing Framework (Jest + RTL)                        │
│  ├── Code Quality (ESLint + Prettier)                      │
│  └── CI/CD Pipeline                                        │
└─────────────────────────────────────────────────────────────┘
```

## 📐 Design Principles

### 1. **Separation of Concerns**
- **Components**: Focus solely on rendering and user interaction
- **Stores**: Handle business logic and state management
- **Services**: Manage data fetching and external API communication
- **Utilities**: Provide reusable helper functions

### 2. **Unidirectional Data Flow**
```
User Action → Component → Store Action → State Update → Component Re-render
```

### 3. **Type Safety First**
- Strict TypeScript configuration
- Runtime validation with Zod
- Interface-driven development
- Compile-time error detection

### 4. **Performance by Default**
- Component memoization
- Lazy loading
- Code splitting
- Optimized bundle sizes

## 🎨 Presentation Layer

### Component Architecture

```tsx
// Modern functional component pattern
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onEdit,
  loading = false
}) => {
  // Custom hooks for logic
  const { isEditing, toggleEdit } = useEditMode();
  
  // Early returns for loading/error states
  if (loading) return <Spinner />;
  
  return (
    <StyledWrapper data-testid="user-profile">
      {/* JSX with clear component composition */}
    </StyledWrapper>
  );
};
```

### Styling Strategy

**Hybrid Approach**: Styled Components + Ant Design

```tsx
// Styled Components for custom styling
const StyledCard = styled(Card)`
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .ant-card-body {
    padding: 24px;
  }
`;

// Ant Design for consistent UI components
<StyledCard>
  <Form>
    <Form.Item label="Name">
      <Input value={name} onChange={handleNameChange} />
    </Form.Item>
  </Form>
</StyledCard>
```

### Component Patterns

1. **Container vs Presentational**
   - Container components connect to stores
   - Presentational components receive props

2. **Compound Components**
   - Related components grouped together
   - Shared context and state

3. **Render Props & Custom Hooks**
   - Logic reuse across components
   - Cleaner component interfaces

## 🧠 State Management Layer

### MobX Architecture

```tsx
// Store structure
export class UserStore {
  // Observable state
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      // Explicit action definitions
      fetchUsers: action,
      addUser: action,
      updateUser: action,
    });
  }

  // Computed values
  get activeUsers() {
    return this.users.filter(user => user.isActive);
  }

  // Actions
  @action.bound
  async fetchUsers() {
    this.loading = true;
    try {
      this.users = await userService.getUsers();
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }
}
```

### Store Composition

```tsx
// Root store pattern
export class RootStore {
  userStore: UserStore;
  authStore: AuthStore;
  uiStore: UIStore;

  constructor() {
    this.userStore = new UserStore(this);
    this.authStore = new AuthStore(this);
    this.uiStore = new UIStore(this);
  }
}

// React context for dependency injection
export const StoreContext = createContext<RootStore>();
export const useStore = () => useContext(StoreContext);
```

### State Flow Patterns

1. **Command Query Separation**
   - Actions modify state
   - Computed values read state
   - Clear separation of responsibilities

2. **Error Boundaries**
   - Graceful error handling
   - Fallback UI components
   - Error reporting

## 🌐 Service Layer

### API Service Architecture

```tsx
// Base API client
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = authStore.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Global error handling
        return Promise.reject(error);
      }
    );
  }
}
```

### Data Fetching with SWR

```tsx
// SWR integration for caching and revalidation
export const useUsers = () => {
  const { data, error, mutate } = useSWR(
    'users',
    () => userService.getUsers(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );

  return {
    users: data || [],
    loading: !error && !data,
    error,
    refresh: mutate,
  };
};
```

### Validation Strategy

```tsx
// Zod schemas for runtime validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  role: z.enum(['admin', 'user', 'moderator']),
});

export type User = z.infer<typeof UserSchema>;

// Service with validation
export class UserService {
  async createUser(userData: unknown): Promise<User> {
    // Validate input
    const validatedData = UserSchema.parse(userData);
    
    // API call
    const response = await apiClient.post('/users', validatedData);
    
    // Validate response
    return UserSchema.parse(response.data);
  }
}
```

## 🛠️ Infrastructure Layer

### Build Configuration

```javascript
// craco.config.js - Webpack customization
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Bundle splitting
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };

      // Path aliases
      webpackConfig.resolve.alias = {
        '@components': path.resolve(__dirname, 'src/components'),
        '@stores': path.resolve(__dirname, 'src/stores'),
        '@services': path.resolve(__dirname, 'src/services'),
      };

      return webpackConfig;
    },
  },
};
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@stores/*": ["stores/*"],
      "@services/*": ["services/*"],
      "@types/*": ["types/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

### Testing Architecture

```tsx
// Testing strategy layers
describe('UserProfile Component', () => {
  // Unit tests - isolated component testing
  it('renders user information correctly', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  // Integration tests - component + store interaction
  it('handles user editing flow', async () => {
    const store = new UserStore();
    render(
      <StoreProvider value={store}>
        <UserProfile user={mockUser} />
      </StoreProvider>
    );
    
    fireEvent.click(screen.getByText('Edit'));
    // Test store interaction
  });
});
```

## 🔄 Data Flow Patterns

### 1. **Optimistic Updates**
```tsx
@action.bound
async updateUser(id: string, updates: Partial<User>) {
  // Optimistic update
  const user = this.users.find(u => u.id === id);
  if (user) {
    Object.assign(user, updates);
  }

  try {
    await userService.updateUser(id, updates);
  } catch (error) {
    // Rollback on error
    this.fetchUsers(); // Refresh from server
    throw error;
  }
}
```

### 2. **Error Boundaries**
```tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    errorService.captureException(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 3. **Loading States**
```tsx
// Centralized loading state management
export class UIStore {
  private loadingStates = new Map<string, boolean>();

  @action.bound
  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading);
  }

  @computed
  get isLoading() {
    return Array.from(this.loadingStates.values()).some(Boolean);
  }

  isLoadingKey(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }
}
```

## 📊 Performance Patterns

### 1. **Component Optimization**
```tsx
// Memoization for expensive computations
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);

  return <div>{processedData}</div>;
});
```

### 2. **Lazy Loading**
```tsx
// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// Component lazy loading
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

### 3. **Virtual Scrolling**
```tsx
// Large list optimization
const VirtualizedList: React.FC<{ items: Item[] }> = ({ items }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {ItemRenderer}
    </FixedSizeList>
  );
};
```

## 🔒 Security Patterns

### 1. **Authentication Flow**
```tsx
// JWT-based authentication
export class AuthStore {
  @observable token: string | null = null;
  @observable user: User | null = null;

  @action.bound
  async login(credentials: LoginCredentials) {
    const response = await authService.login(credentials);
    this.token = response.token;
    this.user = response.user;
    
    // Store in secure storage
    tokenStorage.set(response.token);
  }

  @computed
  get isAuthenticated() {
    return !!this.token && !!this.user;
  }
}
```

### 2. **Route Protection**
```tsx
// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore().authStore;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

## 📈 Scalability Patterns

### 1. **Feature-Based Organization**
```
src/
├── features/
│   ├── user-management/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── services/
│   │   └── pages/
│   └── dashboard/
│       ├── components/
│       ├── stores/
│       ├── services/
│       └── pages/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
```

### 2. **Micro-Frontend Ready**
```tsx
// Module federation configuration
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'user_management',
      filename: 'remoteEntry.js',
      exposes: {
        './UserManagement': './src/features/user-management',
      },
      shared: ['react', 'react-dom', 'mobx'],
    }),
  ],
};
```

---

**Next**: Learn about [Code Generators](./generators.md) to understand how the framework creates consistent code.