import { makeObservable, observable, action, computed } from 'mobx';
import { apiClient } from '@services/apiClient';
import type { AuthState, User, LoginCredentials, RegisterData, AuthResponse } from './types';

/**
 * @class AuthStore
 * @description MobX store for authentication state management
 */
export class AuthStore implements AuthState {
  @observable public user: User | null = null;

  @observable public token: string | null = null;

  @observable public isLoading = false;

  @observable public error: string | null = null;

  constructor() {
    makeObservable(this);
    this.initializeAuth();
  }

  @computed
  public get isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  @action.bound
  private initializeAuth(): void {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedToken && storedUser) {
      try {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        apiClient.setAuthToken(storedToken);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  @action.bound
  public async login(credentials: LoginCredentials): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const { user, token } = response.data;
      
      this.setAuthData(user, token);
    } catch (error: any) {
      this.error = error.response?.data?.message || 'Login failed';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  @action.bound
  public async register(data: RegisterData): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      const { user, token } = response.data;
      
      this.setAuthData(user, token);
    } catch (error: any) {
      this.error = error.response?.data?.message || 'Registration failed';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  @action.bound
  public async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors, proceed with local cleanup
    } finally {
      this.clearAuth();
    }
  }

  @action.bound
  public async refreshToken(): Promise<void> {
    if (!this.token) return;

    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh');
      const { user, token } = response.data;
      
      this.setAuthData(user, token);
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  @action.bound
  private setAuthData(user: User, token: string): void {
    this.user = user;
    this.token = token;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    apiClient.setAuthToken(token);
  }

  @action.bound
  private clearAuth(): void {
    this.user = null;
    this.token = null;
    this.error = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    apiClient.clearAuthToken();
  }

  @action.bound
  public clearError(): void {
    this.error = null;
  }
}