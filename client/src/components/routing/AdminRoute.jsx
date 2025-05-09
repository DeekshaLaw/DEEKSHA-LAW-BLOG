import { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';

const AdminRoute = ({ component: Component }) => {
  const { isAuthenticated, loading, user, token } = useContext(AuthContext);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Wait for initial loading to complete
      if (loading) {
        return;
      }

      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setHasAdminAccess(false);
        setCheckingAccess(false);
        return;
      }

      try {
        const decoded = jwtDecode(storedToken);
        const isAdmin = decoded && decoded.role === 'admin';
        setHasAdminAccess(isAdmin);
        
        // If we have a valid admin token, ensure it's set in axios headers
        if (isAdmin) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        setHasAdminAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [loading, token]);

  // Show loading spinner while checking authentication
  if (loading || checkingAccess) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Only redirect if we're sure the user is not an admin
  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <Component />;
};

export default AdminRoute; 