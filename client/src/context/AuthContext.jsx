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
    try {
      console.log("loadUser called, token:", token ? "exists" : "none");
      
      if (token && !isTokenExpired(token)) {
        // Set auth token header
        setAuthToken(token);
        
        // Decode the token to check user role
        const decoded = jwtDecode(token);
        console.log("Token decoded in loadUser:", decoded);
        
        // Check if admin role is in the token
        if (decoded && decoded.role === 'admin') {
          console.log("Admin role detected in token");
          // For admin users, fetch admin profile
          const res = await axios.get('/auth/me');
          console.log("Admin user profile loaded:", res.data);
          setUser(res.data.data);
          setIsAuthenticated(true);
        } else {
          console.log("Regular user role in token");
          // For regular users
          const res = await axios.get('/auth/me');
          console.log("User profile loaded:", res.data);
          setUser(res.data.data);
          setIsAuthenticated(true);
        }
      } else {
        // Clear token if expired
        console.log("Token is expired or missing, clearing auth state");
        setAuthToken(null);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Error in loadUser:", err);
      setAuthToken(null);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
    
    setLoading(false);
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
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 