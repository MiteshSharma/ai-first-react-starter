# State Management with MobX

The AI-First React Framework uses MobX for state management, providing a reactive and intuitive approach to handling application state. This guide covers MobX patterns, best practices, and integration with React.

## 🧠 MobX Philosophy

MobX follows the principle that **anything that can be derived from the application state, should be derived automatically**. This leads to:

- **Minimal state**: Only store what cannot be computed
- **Automatic updates**: UI updates when state changes
- **Simple mental model**: Direct state mutations with automatic reactivity

## 🏗️ Store Architecture

### Root Store Pattern

```typescript
// src/stores/RootStore.ts
import { UserStore } from './UserStore';
import { AuthStore } from './AuthStore';
import { UIStore } from './UIStore';

export class RootStore {
  userStore: UserStore;
  authStore: AuthStore;
  uiStore: UIStore;

  constructor() {
    this.userStore = new UserStore(this);
    this.authStore = new AuthStore(this);
    this.uiStore = new UIStore(this);
  }

  // Global actions that coordinate multiple stores
  async initialize() {
    if (this.authStore.isAuthenticated) {
      await this.userStore.fetchCurrentUser();
      await this.userStore.fetchUserPreferences();
    }
  }

  // Cleanup method
  dispose() {
    this.userStore.dispose();
    this.authStore.dispose();
    this.uiStore.dispose();
  }
}
```

### Store Provider Context

```typescript
// src/stores/StoreContext.tsx
import React, { createContext, useContext } from 'react';
import { RootStore } from './RootStore';

const StoreContext = createContext<RootStore | null>(null);

export const StoreProvider: React.FC<{ 
  children: React.ReactNode;
  store?: RootStore;
}> = ({ children, store = new RootStore() }) => (
  <StoreContext.Provider value={store}>
    {children}
  </StoreContext.Provider>
);

export const useStore = (): RootStore => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return store;
};

// Individual store hooks
export const useUserStore = () => useStore().userStore;
export const useAuthStore = () => useStore().authStore;
export const useUIStore = () => useStore().uiStore;
```

## 🗄️ Store Patterns

### CRUD Store Pattern

```typescript
// src/stores/UserStore.ts
import { makeAutoObservable, action, computed, runInAction } from 'mobx';
import { userService } from '@services/UserService';
import type { RootStore } from './RootStore';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UserStore {
  // Observable state
  users: User[] = [];
  selectedUser: User | null = null;
  loading = false;
  error: string | null = null;
  
  // Pagination state
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;

  // Filters
  searchQuery = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    
    makeAutoObservable(this, {
      // Explicit action definitions
      fetchUsers: action,
      createUser: action,
      updateUser: action,
      deleteUser: action,
      setSelectedUser: action,
      setSearchQuery: action,
      setStatusFilter: action,
      setPage: action,
      
      // Computed values
      filteredUsers: computed,
      paginatedUsers: computed,
      userCount: computed,
      hasUsers: computed,
      isLoading: computed,
    });
  }

  // Computed values
  @computed
  get filteredUsers(): User[] {
    let filtered = this.users;

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        this.statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    return filtered;
  }

  @computed
  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  @computed
  get userCount(): number {
    return this.filteredUsers.length;
  }

  @computed
  get hasUsers(): boolean {
    return this.users.length > 0;
  }

  @computed
  get isLoading(): boolean {
    return this.loading;
  }

  @computed
  get totalPages(): number {
    return Math.ceil(this.userCount / this.pageSize);
  }

  // Actions
  @action.bound
  async fetchUsers(refresh = false) {
    if (this.loading && !refresh) return;
    
    this.loading = true;
    this.error = null;

    try {
      const response = await userService.getUsers({
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchQuery,
        status: this.statusFilter,
      });

      runInAction(() => {
        this.users = response.data;
        this.totalCount = response.total;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch users';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  @action.bound
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    this.loading = true;
    this.error = null;

    try {
      const newUser = await userService.createUser(userData);
      
      runInAction(() => {
        this.users.unshift(newUser);
        this.totalCount++;
      });

      return newUser;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create user';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  @action.bound
  async updateUser(id: string, updates: Partial<User>) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return;

    // Optimistic update
    const originalUser = { ...this.users[userIndex] };
    runInAction(() => {
      Object.assign(this.users[userIndex], updates);
    });

    try {
      const updatedUser = await userService.updateUser(id, updates);
      
      runInAction(() => {
        this.users[userIndex] = updatedUser;
        if (this.selectedUser?.id === id) {
          this.selectedUser = updatedUser;
        }
      });

      return updatedUser;
    } catch (error) {
      // Rollback on error
      runInAction(() => {
        this.users[userIndex] = originalUser;
      });
      
      this.error = error instanceof Error ? error.message : 'Failed to update user';
      throw error;
    }
  }

  @action.bound
  async deleteUser(id: string) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return;

    // Optimistic removal
    const removedUser = this.users[userIndex];
    runInAction(() => {
      this.users.splice(userIndex, 1);
      this.totalCount--;
      if (this.selectedUser?.id === id) {
        this.selectedUser = null;
      }
    });

    try {
      await userService.deleteUser(id);
    } catch (error) {
      // Rollback on error
      runInAction(() => {
        this.users.splice(userIndex, 0, removedUser);
        this.totalCount++;
      });
      
      this.error = error instanceof Error ? error.message : 'Failed to delete user';
      throw error;
    }
  }

  // UI Actions
  @action.bound
  setSelectedUser(user: User | null) {
    this.selectedUser = user;
  }

  @action.bound
  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.currentPage = 1; // Reset pagination
  }

  @action.bound
  setStatusFilter(status: typeof this.statusFilter) {
    this.statusFilter = status;
    this.currentPage = 1; // Reset pagination
  }

  @action.bound
  setPage(page: number) {
    this.currentPage = page;
  }

  @action.bound
  clearError() {
    this.error = null;
  }

  // Utility methods
  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  // Cleanup
  dispose() {
    // Clean up any reactions, timers, etc.
  }
}
```

### Authentication Store

```typescript
// src/stores/AuthStore.ts
import { makeAutoObservable, action } from 'mobx';
import { authService } from '@services/AuthService';
import type { RootStore } from './RootStore';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
}

export class AuthStore {
  user: AuthUser | null = null;
  token: string | null = null;
  refreshToken: string | null = null;
  loading = false;
  error: string | null = null;

  private rootStore: RootStore;
  private refreshTimer?: NodeJS.Timeout;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    
    makeAutoObservable(this, {
      login: action,
      logout: action,
      refreshAuth: action,
      setUser: action,
      clearError: action,
    });

    // Initialize from stored tokens
    this.initializeFromStorage();
  }

  @computed
  get isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  @computed
  get isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  @computed
  get userPermissions(): string[] {
    return this.user?.permissions || [];
  }

  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }

  @action.bound
  async login(email: string, password: string) {
    this.loading = true;
    this.error = null;

    try {
      const response = await authService.login({ email, password });
      
      runInAction(() => {
        this.user = response.user;
        this.token = response.token;
        this.refreshToken = response.refreshToken;
      });

      // Store tokens securely
      this.storeTokens(response.token, response.refreshToken);
      
      // Setup auto-refresh
      this.setupTokenRefresh();

      // Initialize user data in other stores
      await this.rootStore.initialize();

    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Login failed';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  @action.bound
  async logout() {
    try {
      if (this.refreshToken) {
        await authService.logout(this.refreshToken);
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  @action.bound
  async refreshAuth() {
    if (!this.refreshToken) {
      this.logout();
      return;
    }

    try {
      const response = await authService.refreshToken(this.refreshToken);
      
      runInAction(() => {
        this.token = response.token;
        this.refreshToken = response.refreshToken;
      });

      this.storeTokens(response.token, response.refreshToken);
      this.setupTokenRefresh();

    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
    }
  }

  @action.bound
  setUser(user: AuthUser) {
    this.user = user;
  }

  @action.bound
  clearError() {
    this.error = null;
  }

  @action.bound
  private clearAuthData() {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.clearStoredTokens();
    this.clearTokenRefresh();
  }

  private initializeFromStorage() {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token && refreshToken) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.setupTokenRefresh();
      
      // Validate token and fetch user
      this.validateAndFetchUser();
    }
  }

  private async validateAndFetchUser() {
    try {
      const user = await authService.getCurrentUser();
      runInAction(() => {
        this.user = user;
      });
    } catch (error) {
      this.logout();
    }
  }

  private storeTokens(token: string, refreshToken: string) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearStoredTokens() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  private setupTokenRefresh() {
    this.clearTokenRefresh();
    
    // Refresh token 5 minutes before expiry
    const tokenExpiry = this.getTokenExpiry();
    if (tokenExpiry) {
      const refreshTime = tokenExpiry - Date.now() - (5 * 60 * 1000);
      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshAuth();
        }, refreshTime);
      }
    }
  }

  private clearTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private getTokenExpiry(): number | null {
    if (!this.token) return null;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }

  dispose() {
    this.clearTokenRefresh();
  }
}
```

### UI Store for Global UI State

```typescript
// src/stores/UIStore.ts
import { makeAutoObservable, action } from 'mobx';
import type { RootStore } from './RootStore';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export class UIStore {
  // Layout state
  sidebarCollapsed = false;
  theme: 'light' | 'dark' = 'light';
  
  // Loading states
  private loadingStates = new Map<string, boolean>();
  
  // Notifications
  notifications: Notification[] = [];
  
  // Modals
  private openModals = new Set<string>();
  
  // Navigation
  breadcrumbs: Array<{ label: string; path?: string }> = [];

  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    
    makeAutoObservable(this, {
      toggleSidebar: action,
      setTheme: action,
      setLoading: action,
      addNotification: action,
      removeNotification: action,
      openModal: action,
      closeModal: action,
      setBreadcrumbs: action,
    });

    this.initializeFromStorage();
  }

  // Computed values
  @computed
  get isLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(Boolean);
  }

  @computed
  get activeNotifications(): Notification[] {
    return this.notifications.slice(0, 5); // Show max 5 notifications
  }

  // Layout actions
  @action.bound
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', String(this.sidebarCollapsed));
  }

  @action.bound
  setTheme(theme: 'light' | 'dark') {
    this.theme = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Loading state management
  @action.bound
  setLoading(key: string, loading: boolean) {
    if (loading) {
      this.loadingStates.set(key, true);
    } else {
      this.loadingStates.delete(key);
    }
  }

  isLoadingKey(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  // Notification management
  @action.bound
  addNotification(notification: Omit<Notification, 'id'>) {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    this.notifications.push(newNotification);

    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }

  @action.bound
  removeNotification(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }

  @action.bound
  clearNotifications() {
    this.notifications.clear();
  }

  // Modal management
  @action.bound
  openModal(modalId: string) {
    this.openModals.add(modalId);
  }

  @action.bound
  closeModal(modalId: string) {
    this.openModals.delete(modalId);
  }

  isModalOpen(modalId: string): boolean {
    return this.openModals.has(modalId);
  }

  // Navigation
  @action.bound
  setBreadcrumbs(breadcrumbs: Array<{ label: string; path?: string }>) {
    this.breadcrumbs = breadcrumbs;
  }

  // Helper methods
  showSuccessNotification(title: string, message?: string) {
    return this.addNotification({ type: 'success', title, message });
  }

  showErrorNotification(title: string, message?: string) {
    return this.addNotification({ type: 'error', title, message });
  }

  showWarningNotification(title: string, message?: string) {
    return this.addNotification({ type: 'warning', title, message });
  }

  showInfoNotification(title: string, message?: string) {
    return this.addNotification({ type: 'info', title, message });
  }

  private initializeFromStorage() {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.setTheme(savedTheme);
    }

    // Initialize sidebar state
    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      this.sidebarCollapsed = sidebarState === 'true';
    }
  }

  dispose() {
    this.notifications.clear();
    this.openModals.clear();
    this.loadingStates.clear();
  }
}
```

## ⚛️ React Integration

### Observer Components

```typescript
// src/components/UserList/UserList.tsx
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useUserStore } from '@stores';

export const UserList: React.FC = observer(() => {
  const userStore = useUserStore();

  useEffect(() => {
    userStore.fetchUsers();
  }, [userStore]);

  if (userStore.loading) {
    return <div>Loading users...</div>;
  }

  if (userStore.error) {
    return <div>Error: {userStore.error}</div>;
  }

  return (
    <div>
      <h2>Users ({userStore.userCount})</h2>
      {userStore.paginatedUsers.map(user => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
});
```

### Reaction Hook

```typescript
// src/hooks/useReaction.ts
import { useEffect } from 'react';
import { reaction, IReactionDisposer } from 'mobx';

export const useReaction = <T>(
  expression: () => T,
  effect: (arg: T) => void,
  deps: any[] = []
) => {
  useEffect(() => {
    const disposer: IReactionDisposer = reaction(expression, effect);
    return () => disposer();
  }, deps);
};

// Usage example
const UserProfile: React.FC = observer(() => {
  const { userStore, uiStore } = useStore();

  // React to user changes
  useReaction(
    () => userStore.selectedUser,
    (user) => {
      if (user) {
        uiStore.setBreadcrumbs([
          { label: 'Users', path: '/users' },
          { label: user.name }
        ]);
      }
    }
  );

  // ... component logic
});
```

## 🔄 Advanced Patterns

### Async Actions with Error Handling

```typescript
// src/stores/utils/asyncAction.ts
import { action, runInAction } from 'mobx';

export function asyncAction<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return action(async (...args: T): Promise<R> => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      runInAction(() => {
        // Handle error in MobX context
        throw error;
      });
      throw error;
    }
  });
}

// Usage
class DataStore {
  @asyncAction
  async fetchData() {
    const data = await apiCall();
    runInAction(() => {
      this.data = data;
    });
  }
}
```

### Store Persistence

```typescript
// src/stores/utils/persistence.ts
import { reaction } from 'mobx';

export function persistStore<T>(
  store: T,
  key: string,
  properties: (keyof T)[]
) {
  // Load persisted state
  const persisted = localStorage.getItem(key);
  if (persisted) {
    try {
      const data = JSON.parse(persisted);
      Object.assign(store, data);
    } catch (error) {
      console.warn('Failed to load persisted store:', error);
    }
  }

  // Save state changes
  reaction(
    () => {
      const state: Partial<T> = {};
      properties.forEach(prop => {
        state[prop] = store[prop];
      });
      return state;
    },
    (state) => {
      localStorage.setItem(key, JSON.stringify(state));
    }
  );
}

// Usage
class UIStore {
  constructor() {
    makeAutoObservable(this);
    persistStore(this, 'ui_store', ['theme', 'sidebarCollapsed']);
  }
}
```

### Store Composition

```typescript
// src/stores/CompositeStore.ts
export class ProjectStore {
  private userStore: UserStore;
  private taskStore: TaskStore;

  constructor(rootStore: RootStore) {
    this.userStore = rootStore.userStore;
    this.taskStore = rootStore.taskStore;
    
    makeAutoObservable(this);
  }

  @computed
  get projectMembers() {
    return this.userStore.users.filter(user => 
      this.taskStore.tasks.some(task => task.assigneeId === user.id)
    );
  }

  @computed
  get userTaskCounts() {
    return this.userStore.users.map(user => ({
      user,
      taskCount: this.taskStore.tasks.filter(task => 
        task.assigneeId === user.id
      ).length
    }));
  }
}
```

## 🧪 Testing MobX Stores

### Store Testing

```typescript
// src/stores/__tests__/UserStore.test.ts
import { UserStore } from '../UserStore';
import { RootStore } from '../RootStore';

describe('UserStore', () => {
  let rootStore: RootStore;
  let userStore: UserStore;

  beforeEach(() => {
    rootStore = new RootStore();
    userStore = rootStore.userStore;
  });

  describe('computed values', () => {
    it('filters users correctly', () => {
      userStore.users = [
        { id: '1', name: 'John', isActive: true },
        { id: '2', name: 'Jane', isActive: false },
      ];
      
      userStore.setStatusFilter('active');
      
      expect(userStore.filteredUsers).toHaveLength(1);
      expect(userStore.filteredUsers[0].name).toBe('John');
    });
  });

  describe('actions', () => {
    it('creates user successfully', async () => {
      const userData = { name: 'John', email: 'john@example.com' };
      
      // Mock service
      jest.spyOn(userService, 'createUser').mockResolvedValue({
        id: '1',
        ...userData,
        isActive: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      });

      await userStore.createUser(userData);

      expect(userStore.users).toHaveLength(1);
      expect(userStore.users[0].name).toBe('John');
    });
  });
});
```

## 📚 Best Practices

### 1. Store Organization
- One store per domain/feature
- Keep stores focused and cohesive
- Use composition over inheritance

### 2. State Design
- Store minimal state
- Derive everything possible with computed values
- Normalize complex data structures

### 3. Actions
- Use `runInAction` for async operations
- Implement optimistic updates where appropriate
- Handle errors gracefully

### 4. Performance
- Use `observer` for components that read observable data
- Avoid creating observables in render methods
- Use `reaction` for side effects

### 5. Type Safety
- Define proper TypeScript interfaces
- Use strict type checking
- Validate data from external sources

---

This comprehensive guide provides the foundation for effective state management with MobX in your AI-First React applications.