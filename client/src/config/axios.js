import axios from 'axios';

// Set default base URL for all requests
axios.defaults.baseURL = 'http://localhost:5000/api';

// Add a request interceptor
axios.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Request to ${config.url}: Token attached`);
    } else {
      console.log(`Request to ${config.url}: No auth token available`);
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
  response => {
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Error: ${error.config.url} - Status: ${error.response.status}`, error.response.data);
    } else {
      console.error('Axios error (no response):', error.message);
    }
    return Promise.reject(error);
  }
);

export default axios; 