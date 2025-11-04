// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// Create a custom hook to use the context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You could validate the token here with the backend
      // For now, we'll assume it's valid
      setCurrentUser({ token });
    }
    setLoading(false);
  }, []);

  const signup = async (formData) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role || 'user',
        phone: formData.phone,
        address: formData.address,
      });

      // Store token and set user
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);

      return { success: true };

    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.response?.data?.message || 'Network error or server is down.' };
    }
  };

  const login = async (formData) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      // Store token and set user
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);

      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Network error or server is down.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    getAuthHeaders
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
