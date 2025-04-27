import axios from 'axios';

// Set default base URL for all requests using environment variable
const API_URL = import.meta.env.VITE_API_URL;

// Set axios defaults
axios.defaults.baseURL = API_URL;
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
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
    } else if (error.request) {
      // The request was made but no response was received
      error.response = { data: { message: 'Network error. Please check your internet connection.' } };
    } else if (error.code === 'ECONNABORTED') {
      // The request timed out
      error.response = { data: { message: 'Request timed out. Please try again later.' } };
    } else {
      // Something happened in setting up the request that triggered an Error
      error.response = { data: { message: 'An unexpected error occurred.' } };
    }
    return Promise.reject(error);
  }
);

export default axios; 