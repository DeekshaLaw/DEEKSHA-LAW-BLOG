import axios from 'axios';

// Set default base URL for all requests
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

// Set a reasonable timeout value
axios.defaults.timeout = 15000;

// Add a request interceptor
axios.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`API Error: ${error.config?.url} - Status: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error: No response received from server', error.message);
      error.response = { data: { message: 'Network error. Please check your internet connection.' } };
    } else if (error.code === 'ECONNABORTED') {
      // The request timed out
      console.error('Timeout Error: Request took too long to complete', error.message);
      error.response = { data: { message: 'Request timed out. Please try again.' } };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
      error.response = { data: { message: 'An unexpected error occurred. Please try again.' } };
    }
    return Promise.reject(error);
  }
);

export default axios; 