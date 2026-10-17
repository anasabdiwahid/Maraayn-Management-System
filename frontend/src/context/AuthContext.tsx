import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client.js';
import { User, Tenant } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  login: (loginIdentifier: string, pass: string) => Promise<{ user: User; tenant: Tenant | null }>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  updateTenantData: (tenant: Partial<Tenant>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('maraayn_access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          setTenant(res.data.tenant || null);
        }
      } catch (err) {
        console.error('Session validation error:', err);
        localStorage.removeItem('maraayn_access_token');
        setUser(null);
        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (loginIdentifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        loginIdentifier,
        password: pass,
      });

      const { accessToken, refreshToken, user: loggedUser, tenant: loggedTenant } = res.data;

      localStorage.setItem('maraayn_access_token', accessToken);
      localStorage.setItem('maraayn_refresh_token', refreshToken);

      setUser(loggedUser);
      setTenant(loggedTenant);

      return { user: loggedUser, tenant: loggedTenant };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('maraayn_access_token');
      localStorage.removeItem('maraayn_refresh_token');
      setUser(null);
      setTenant(null);
      window.location.href = '/login';
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        setTenant(res.data.tenant || null);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  const updateTenantData = (updated: Partial<Tenant>) => {
    if (tenant) {
      setTenant({ ...tenant, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isLoading,
        login,
        logout,
        refreshUserData,
        updateTenantData,
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

