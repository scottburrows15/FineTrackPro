import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../lib/apiClient';
import { API_ENDPOINTS } from '../config/api';

const TOKEN_KEY = 'auth_token';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'admin';
  teamId: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await apiClient.get<User>(API_ENDPOINTS.auth.user);
      setUser(userData);
    } catch {
      setUser(null);
      apiClient.setAuthToken(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          apiClient.setAuthToken(storedToken);
          await refreshUser();
        }
      } catch {
        // SecureStore may not be available in all environments
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{ token: string; user: User }>(
      API_ENDPOINTS.auth.login,
      { email, password }
    );
    apiClient.setAuthToken(response.token);
    await SecureStore.setItemAsync(TOKEN_KEY, response.token).catch(() => {});
    setUser(response.user);
  };

  const register = async (email: string, password: string, username: string) => {
    const response = await apiClient.post<{ token: string; user: User }>(
      API_ENDPOINTS.auth.register,
      { email, password, username }
    );
    apiClient.setAuthToken(response.token);
    await SecureStore.setItemAsync(TOKEN_KEY, response.token).catch(() => {});
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } catch {
      // Ignore logout errors
    }
    apiClient.setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
