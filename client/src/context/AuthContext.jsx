import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
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
    const token = localStorage.getItem('token');
    
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    
    try {
      const decoded = jwtDecode(token);
      
      if (decoded.role === 'admin') {
        const res = await axios.get('/users/admin/profile');
        setUser(res.data.data);
      } else {
        const res = await axios.get('/users/profile');
        setUser(res.data.data);
      }
      
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error loading user:', err);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      setError(null);
      const res = await axios.post('/auth/register', formData);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
      throw err;
    }
  };

  // Verify email with OTP
  const verifyEmail = async (formData) => {
    try {
      setError(null);
      const res = await axios.post('/auth/verify', formData);
      setToken(res.data.token);
      setAuthToken(res.data.token);
      await loadUser();
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
      throw err;
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    try {
      setError(null);
      const res = await axios.post('/auth/resend-verification', { email });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending verification email');
      throw err;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      setError(null);
      console.log("Login attempt with:", formData.email);
      
      // Validate inputs before sending request
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        throw new Error('Email and password are required');
      }
      
      const res = await axios.post('/auth/login', formData);
      console.log("Login response:", res.data);
      
      // Check if token is present in response
      if (!res.data.token) {
        console.error("No token received in login response");
        setError('Authentication failed - no token received');
        throw new Error("Authentication failed - no token received");
      }
      
      // Try to decode the token to verify it has the right structure
      try {
        const decoded = jwtDecode(res.data.token);
        
        // Validate token structure
        if (!decoded || typeof decoded !== 'object' || !decoded.id) {
          console.error("Invalid token structure:", decoded);
          setError('Invalid authentication token received');
          throw new Error('Invalid authentication token structure');
        }
        
        console.log("Decoded token:", decoded);
        
        // Store token in localStorage first
        localStorage.setItem('token', res.data.token);
        
        // Set token in state and axios headers
        setToken(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        
        // Set user data directly from the login response
        setUser(res.data.user);
        setIsAuthenticated(true);
        setLoading(false);
      } catch (decodeErr) {
        console.error("Token decode error:", decodeErr);
        setError('Invalid authentication token');
        throw decodeErr;
      }
      
      return res.data;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || 'Invalid credentials');
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      setError(null);
      const res = await axios.put('/users/profile', formData);
      setUser(res.data.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
      throw err;
    }
  };

  // Forgot Password - Send reset OTP
  const forgotPassword = async (email) => {
    try {
      setError(null);
      
      // Create a clean axios instance without auth headers for this request
      const axiosInstance = axios.create({
        baseURL: axios.defaults.baseURL
      });
      
      // Make API call without authorization header
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing password reset request');
      throw err;
    }
  };

  // Reset Password with OTP
  const resetPassword = async ({ email, otp, password }) => {
    try {
      setError(null);
      
      // Create a clean axios instance without auth headers for this request
      const axiosInstance = axios.create({
        baseURL: axios.defaults.baseURL
      });
      
      // Make API call without authorization header
      const res = await axiosInstance.post('/auth/reset-password', { 
        email, 
        otp, 
        password 
      });
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
      throw err;
    }
  };

  // Verify Reset Password OTP
  const verifyResetOTP = async ({ email, otp }) => {
    try {
      setError(null);
      
      // Create a clean axios instance without auth headers for this request
      const axiosInstance = axios.create({
        baseURL: axios.defaults.baseURL
      });
      
      // Make API call without authorization header
      const res = await axiosInstance.post('/auth/verify-reset-otp', { email, otp });
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying OTP');
      throw err;
    }
  };

  // Load user when token changes
  useEffect(() => {
    loadUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loading,
        error,
        register,
        verifyEmail,
        resendVerification,
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