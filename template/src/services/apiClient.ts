import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * @class ApiClient
 * @description Centralized API client with interceptors and error handling
 */
class ApiClient {
  private client: AxiosInstance;

  private retryCount = 3;

  private retryDelay = 1000;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        (config as any).metadata = { startTime: new Date() };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time in development
        if (process.env.NODE_ENV === 'development') {
          const endTime = new Date();
          const startTime = (response.config as any).metadata?.startTime;
          if (startTime) {
            const duration = endTime.getTime() - startTime.getTime();
            console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
          }
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Clear stored token
          localStorage.removeItem('authToken');
          
          // Redirect to login or emit auth error event
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          return Promise.reject(error);
        }

        // Handle retry for network errors or 5xx errors
        if (this.shouldRetry(error) && !originalRequest._retryCount) {
          originalRequest._retryCount = 0;
        }

        if (originalRequest._retryCount < this.retryCount) {
          originalRequest._retryCount++;
          
          // Exponential backoff
          const delay = this.retryDelay * 2**(originalRequest._retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.client(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status <= 599) ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT'
    );
  }

  // HTTP methods
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // Utility methods
  public setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  public clearAuthToken(): void {
    localStorage.removeItem('authToken');
    delete this.client.defaults.headers.common.Authorization;
  }

  public updateBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();