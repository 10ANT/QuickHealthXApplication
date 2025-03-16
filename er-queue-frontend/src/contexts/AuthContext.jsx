import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadUserData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setError(null);
    } catch (err) {
      console.error('Failed to load user data:', err);
      logout();
      setError('Session expired. Please login again.');
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      setCurrentUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setError(null);
      return data.user;
    } catch (err) {
      console.error('Login failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      setCurrentUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setError(null);
      return data.user;
    } catch (err) {
      console.error('Registration failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      setError(null);
      setLoading(false);
    }
  };
  
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isDoctor: currentUser?.role === 'DOCTOR',
    isNurse: currentUser?.role === 'NURSE',
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};