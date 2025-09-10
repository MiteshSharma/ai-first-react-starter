import React, { createContext, useContext, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { AuthStore } from './AuthStore';

/**
 * @component AuthProvider
 * @description React context provider for authentication
 */
const AuthContext = createContext<AuthStore | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

const authStore = new AuthStore();

export const AuthProvider: React.FC<AuthProviderProps> = observer(({ children }) => {
  useEffect(() => {
    // Listen for auth logout events from API client
    const handleLogout = () => {
      authStore.logout();
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
});

/**
 * @hook useAuth
 * @description Hook to access authentication store
 * @returns {AuthStore} The authentication store instance
 */
export const useAuth = (): AuthStore => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};