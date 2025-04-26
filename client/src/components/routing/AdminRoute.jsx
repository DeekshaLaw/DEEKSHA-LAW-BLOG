import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../../context/AuthContext';

const AdminRoute = ({ component: Component }) => {
  const { isAuthenticated, loading, user, token } = useContext(AuthContext);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    console.log("AdminRoute - Authentication State:");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("loading:", loading);
    console.log("user:", user);
    console.log("token exists:", !!token);
    
    // Direct token check
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        console.log("AdminRoute - decoded token:", decoded);
        
        if (decoded && decoded.role === 'admin') {
          console.log("Admin role confirmed from token");
          setHasAdminAccess(true);
        } else {
          console.log("Not an admin role in token");
          setHasAdminAccess(false);
        }
      } catch (err) {
        console.error("Error decoding token:", err);
        setHasAdminAccess(false);
      }
    } else {
      console.log("No token found in localStorage");
      setHasAdminAccess(false);
    }
    
    setCheckingAccess(false);
  }, [isAuthenticated, loading, user, token]);

  if (loading || checkingAccess) {
    return <div>Loading...</div>;
  }

  if (!hasAdminAccess) {
    console.log("Redirecting to admin login - Not an admin");
    return <Navigate to="/admin-login" />;
  }

  return <Component />;
};

export default AdminRoute; 