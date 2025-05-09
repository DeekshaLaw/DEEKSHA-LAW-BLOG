import { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../../context/AuthContext';

const AdminRoute = ({ component: Component }) => {
  const { isAuthenticated, loading, user, token } = useContext(AuthContext);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isAuthenticated || !token) {
        setHasAdminAccess(false);
        setCheckingAccess(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        setHasAdminAccess(decoded && decoded.role === 'admin');
      } catch (err) {
        console.error("Error checking admin access:", err);
        setHasAdminAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, token]);

  if (loading || checkingAccess) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminAccess) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <Component />;
};

export default AdminRoute; 