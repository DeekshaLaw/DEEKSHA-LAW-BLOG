import { createContext, useState, useEffect } from 'react';
import axios from '../config/axios';
import { jwtDecode } from 'jwt-decode';

// Create the context
const AuthContext = createContext();

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    // Add an extra safety check for malformed tokens
    if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  } catch (err) {
    console.error('Token validation error:', err);
    return true;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token in axios header
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Load user with token
  const loadUser = async () => {
    try {
      console.log("loadUser called, token:", token ? "exists" : "none");
      
      if (token && !isTokenExpired(token)) {
        // Set auth token header
        setAuthToken(token);
        
        // Get user data
        const res = await axios.get('/auth/me');
        setUser(res.data.data);
        setIsAuthenticated(true);
      } else {
        console.log("Token is expired or missing, clearing auth state");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthToken(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post('/auth/register', formData);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post('/auth/login', formData);
      setToken(res.data.token);
      setAuthToken(res.data.token);
      await loadUser();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/users/profile', formData);
      setUser(res.data.data);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Reset password
  const resetPassword = async ({ email, otp, password }) => {
    try {
      const res = await axios.post('/auth/reset-password', { email, otp, password });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Verify reset OTP
  const verifyResetOTP = async ({ email, otp }) => {
    try {
      const res = await axios.post('/auth/verify-reset-otp', { email, otp });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Load user on mount and when token changes
  useEffect(() => {
    loadUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        forgotPassword,
        resetPassword,
        verifyResetOTP
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 