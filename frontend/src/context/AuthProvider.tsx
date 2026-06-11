import React, { useState } from 'react';
import { AuthContext, User } from './AuthContext.js';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Lazy State Initialization for Token
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });

  // 2. Lazy State Initialization for User
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  // 3. Since values are loaded instantly before the first render,
  // we do not need to wait for a mounting effect; isLoading can stay false.
  const [isLoading] = useState(false);

  const login = (newToken: string, newUser: User) => {
    try {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (err) {
      console.error('Failed to save auth state:', err);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {
      console.error('Failed to clear auth state:', err);
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
