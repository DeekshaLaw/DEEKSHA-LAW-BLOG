import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import VerifyEmail from './pages/VerifyEmail';
import BlogDetails from './pages/BlogDetails';

// User Pages
import Dashboard from './pages/user/Dashboard';
import CreateBlog from './pages/user/CreateBlog';
import EditBlog from './pages/user/EditBlog';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';

// Set axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="container">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/blogs/:id" element={<BlogDetails />} />
              
              {/* User Protected Routes */}
              <Route 
                path="/dashboard" 
                element={<PrivateRoute component={Dashboard} />} 
              />
              <Route 
                path="/blogs/create" 
                element={<PrivateRoute component={CreateBlog} />} 
              />
              <Route 
                path="/blogs/edit/:id" 
                element={<PrivateRoute component={EditBlog} />} 
              />
              
              {/* Admin Protected Routes */}
              <Route 
                path="/admin/dashboard" 
                element={<AdminRoute component={AdminDashboard} />} 
              />
              <Route 
                path="/admin/categories" 
                element={<AdminRoute component={Categories} />} 
              />
              <Route 
                path="/admin/users" 
                element={<AdminRoute component={Users} />} 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
