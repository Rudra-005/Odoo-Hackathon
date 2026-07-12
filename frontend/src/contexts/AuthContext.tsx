import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../config/axios';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone?: string;
  department?: string;
  employee_id?: string;
  profile_photo?: string;
  role: {
    id: string;
    name: string;
    permissions: { name: string }[];
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (access: string, refresh: string, userData: User) => void;
  logout: () => void;
  hasPermission: (permissionName: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Check if token is expired
          const decoded = jwtDecode(token);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            // It's expired. Axios interceptor will handle refresh on next request if needed
            // But we can eagerly try to fetch `me` to validate/refresh
            const response = await api.get('auth/me/');
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Still valid based on time
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          // Invalid token or failed to fetch
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (access: string, refresh: string, userData: User) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await api.post('auth/logout/', { refresh });
      }
    } catch (e) {
      console.error('Logout failed on server');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasPermission = (permissionName: string) => {
    if (!user) return false;
    // For demo purposes, Super Admin has all permissions implicitly
    if (user.role?.name === 'Super Admin') return true;
    return user.role?.permissions?.some(p => p.name === permissionName) || false;
  };

  const hasRole = (roleName: string) => {
    if (!user) return false;
    return user.role?.name === roleName;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
