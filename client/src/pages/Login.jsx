import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { email, password } = formData;
  
  // Check for stored lockout time on component mount
  useEffect(() => {
    const storedLockout = localStorage.getItem('loginLockoutUntil');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        // Clear expired lockout
        localStorage.removeItem('loginLockoutUntil');
        localStorage.removeItem('loginAttempts');
      }
    }
    
    const storedAttempts = localStorage.getItem('loginAttempts');
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts, 10));
    }
  }, []);
  
  // Check if authenticated and redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Timer to clear lockout message
  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        if (lockoutUntil <= Date.now()) {
          setLockoutUntil(null);
          localStorage.removeItem('loginLockoutUntil');
          localStorage.removeItem('loginAttempts');
          setLoginAttempts(0);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const isLocked = () => {
    return lockoutUntil && lockoutUntil > Date.now();
  };
  
  const getLockoutTimeRemaining = () => {
    if (!lockoutUntil) return '';
    
    const remainingMs = lockoutUntil - Date.now();
    if (remainingMs <= 0) return '';
    
    const seconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`;
    }
    
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };
  
  const incrementLoginAttempts = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('loginAttempts', newAttempts.toString());
    
    // Implement exponential backoff for repeated failures
    if (newAttempts >= 5) {
      // Lock for 5 minutes after 5 attempts
      const lockoutTime = Date.now() + (5 * 60 * 1000);
      setLockoutUntil(lockoutTime);
      localStorage.setItem('loginLockoutUntil', lockoutTime.toString());
    }
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Check if account is locked
    if (isLocked()) {
      setError(`Too many failed login attempts. Please try again in ${getLockoutTimeRemaining()}.`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Trim inputs to prevent whitespace issues
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    
    // Basic validation
    if (!trimmedEmail || !trimmedPassword) {
      setError('Please provide both email and password');
      setLoading(false);
      return;
    }
    
    try {
      // Update form data with trimmed values
      const loginData = {
        email: trimmedEmail,
        password: trimmedPassword
      };
      
      await login(loginData);
      
      // Reset attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockoutUntil');
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Increment login attempts on failure
      incrementLoginAttempts();
      
      // Check for specific error responses
      if (err.response) {
        // Handle different HTTP error codes
        switch (err.response.status) {
          case 429:
            // Rate limited by server
            setError('Too many login attempts. Please try again later.');
            break;
          case 401:
            setError('Invalid credentials. Please check your email and password.');
            break;
          case 403:
            setError('Your account is locked or requires verification.');
            break;
          default:
            setError(err.response.data?.message || 'Login failed. Please try again.');
        }
      } else if (err.request) {
        // Network error
        setError('Cannot connect to the server. Please check your internet connection.');
      } else {
        setError('Login failed. Please try again.');
      }
      
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Login</h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {isLocked() ? (
                <div className="alert alert-warning" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Account temporarily locked due to too many failed attempts.
                  <div className="mt-2">
                    Please try again in {getLockoutTimeRemaining()}.
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={password}
                      onChange={onChange}
                      disabled={loading}
                      required
                    />
                    <div className="mt-1 text-end">
                      <Link to="/forgot-password" className="small text-decoration-none">Forgot Password?</Link>
                    </div>
                  </div>
                  <div className="mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </button>
                  </div>
                </form>
              )}
              
              <div className="mt-3 text-center">
                <p>
                  Don't have an account? <Link to="/register">Register</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 