import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/axiosClient';

const AuthContext = createContext(null);

// Helper to decode JWT payload without external libraries
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on load
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUserStr = localStorage.getItem('user');

    if (storedToken) {
      const decoded = parseJwt(storedToken);
      // Check token expiration
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
        setUser({
          userId: decoded.userId,
          role: decoded.role,
          email: storedUser?.email || '',
          department: storedUser?.department || '',
        });
        setToken(storedToken);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const accessToken = res.data?.accessToken;
    if (!accessToken) {
      throw new Error('Access token missing in login response');
    }

    const decoded = parseJwt(accessToken);
    if (!decoded) {
      throw new Error('Failed to decode user credentials from access token');
    }

    const userData = {
      userId: decoded.userId,
      role: decoded.role,
      email: email,
      department: email.includes('it') ? 'IT' : email.includes('travel') ? 'Travel Agency' : 'Management',
    };

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    return await authApi.register(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Backend logout error (clearing local session anyway):', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
