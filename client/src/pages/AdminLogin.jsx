import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { email, password } = formData;
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // First check if the user is an admin
      const checkRes = await axios.post('/auth/check-admin', { email });
      
      if (!checkRes.data.isAdmin) {
        setError('This login is only for administrators');
        setLoading(false);
        return;
      }
      
      // If they are an admin, proceed with login
      const loginResponse = await login(formData);
      console.log("Login successful, navigating to admin dashboard");
      
      // Add a slight delay to ensure token and state are properly set
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 500);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        setError('Invalid admin credentials');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-danger">
            <div className="card-header bg-danger text-white">
              <h2 className="text-center mb-0">Admin Login</h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Admin Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    name="email"
                    value={email}
                    onChange={onChange}
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
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-danger w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Admin Login'}
                </button>
              </form>
              
              <div className="mt-3 text-center">
                <p className="text-muted">
                  <small>This login is for administrators only</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 