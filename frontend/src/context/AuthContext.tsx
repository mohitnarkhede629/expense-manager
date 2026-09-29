import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  baseCurrency: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('em_auth_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('em_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('em_user', JSON.stringify(res.data));
        } catch {
          setToken(null);
          setUser(null);
          localStorage.removeItem('em_auth_token');
          localStorage.removeItem('em_user');
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, ...userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('em_auth_token', jwtToken);
    localStorage.setItem('em_user', JSON.stringify(userData));
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { fullName, email, password, baseCurrency: 'INR' });
    const { token: jwtToken, ...userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('em_auth_token', jwtToken);
    localStorage.setItem('em_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('em_auth_token');
    localStorage.removeItem('em_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
