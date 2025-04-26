import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  // Guest links (not logged in)
  const guestLinks = (
    <>
      <li className="nav-item">
        <Link className="nav-link" to="/">Home</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/login">Login</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/register">Register</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link btn btn-danger text-white" to="/admin-login">Admin Login</Link>
      </li>
    </>
  );

  // User links (regular users)
  const userLinks = (
    <>
      <li className="nav-item">
        <Link className="nav-link" to="/">Home</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/dashboard">Dashboard</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/blogs/create">Create Blog</Link>
      </li>
      <li className="nav-item dropdown">
        <a 
          className="nav-link dropdown-toggle" 
          href="#" 
          role="button" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
        >
          {user && user.name ? `Welcome, ${user.name}` : 'Account'}
        </a>
        <ul className="dropdown-menu dropdown-menu-end">
          <li>
            <a className="dropdown-item" href="#!" onClick={() => logout()}>Logout</a>
          </li>
        </ul>
      </li>
    </>
  );

  // Admin links
  const adminLinks = (
    <>
      <li className="nav-item">
        <Link className="nav-link" to="/">Home</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/admin/dashboard">Admin Dashboard</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/admin/categories">Categories</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/admin/users">Users</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/blogs/create">Create Blog</Link>
      </li>
      <li className="nav-item dropdown">
        <a 
          className="nav-link dropdown-toggle" 
          href="#" 
          role="button" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
        >
          {user && user.name ? `Admin: ${user.name}` : 'Admin Account'}
        </a>
        <ul className="dropdown-menu dropdown-menu-end">
          <li>
            <a className="dropdown-item" href="#!" onClick={() => logout()}>Logout</a>
          </li>
        </ul>
      </li>
    </>
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">DEEKSHA LAW</Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
          </ul>
          <ul className="navbar-nav">
            {isAuthenticated ? (
              user && user.role === 'admin' ? adminLinks : userLinks
            ) : (
              guestLinks
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 