import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [blogs, setBlogs] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    category: '',
    author: ''
  });
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Build query params
        const params = {};
        // Important: Include status even if it's empty string - this means "All Statuses"
        params.status = filters.status;
        if (filters.category) params.category = filters.category;
        if (filters.author) params.author = filters.author;
        
        console.log('Requesting blogs with params:', JSON.stringify(params));
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Log the headers for debugging
        console.log('Authorization header:', token ? `Bearer ${token}` : 'Not set');
        
        // Fetch blogs with applied filters and explicit auth header
        const blogsRes = await axios.get('/blogs', { 
          params,
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        
        console.log('Blog response data:', blogsRes.data);
        
        // If viewing any status other than pending, fetch the pending count separately
        if (filters.status !== 'pending') {
          const pendingRes = await axios.get('/blogs', {
            params: { status: 'pending' },
            headers: {
              Authorization: token ? `Bearer ${token}` : ''
            }
          });
          setPendingCount(pendingRes.data.count);
        } else {
          setPendingCount(blogsRes.data.count);
        }
        
        // Fetch categories
        const categoriesRes = await axios.get('/categories');
        
        // Fetch users
        const usersRes = await axios.get('/users');
        
        setBlogs(blogsRes.data.data);
        setCategories(categoriesRes.data.data);
        setUsers(usersRes.data.data);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);
  
  // Check for pending blogs on initial load
  useEffect(() => {
    const checkPendingBlogs = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Check for pending blogs specifically
        const pendingRes = await axios.get('/blogs', {
          params: { status: 'pending' },
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        
        // If there are pending blogs, automatically select pending filter
        if (pendingRes.data.count > 0) {
          console.log(`Found ${pendingRes.data.count} pending blogs, setting filter to pending`);
          setPendingCount(pendingRes.data.count);
          setFilters(prev => ({...prev, status: 'pending'}));
        }
      } catch (err) {
        console.error('Error checking pending blogs:', err);
      }
    };
    
    checkPendingBlogs();
  }, []); // Empty dependency array so it only runs once on mount
  
  const handleFilterChange = (e) => {
    const newValue = e.target.value;
    const fieldName = e.target.name;
    
    console.log(`Filter changed: ${fieldName} = "${newValue}" (type: ${typeof newValue})`);
    
    setFilters({
      ...filters,
      [fieldName]: newValue
    });
  };
  
  const resetFilters = () => {
    setFilters({
      status: 'pending',
      category: '',
      author: ''
    });
  };
  
  const handleStatusChange = async (blogId, newStatus) => {
    setSelectedBlogId(blogId);
    setStatusLoading(true);
    
    try {
      await axios.put(`/blogs/${blogId}/status`, { status: newStatus });
      
      // Update blog status in state
      setBlogs(blogs.map(blog => 
        blog._id === blogId ? { ...blog, status: newStatus } : blog
      ));
    } catch (err) {
      setError('Failed to update blog status.');
      console.error(err);
    } finally {
      setStatusLoading(false);
      setSelectedBlogId(null);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }
    
    try {
      await axios.delete(`/blogs/${id}`);
      // Update blogs state by removing the deleted blog
      setBlogs(blogs.filter(blog => blog._id !== id));
    } catch (err) {
      setError('Failed to delete blog.');
      console.error(err);
    }
  };
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">
        Admin Dashboard
        {pendingCount > 0 && filters.status !== 'pending' && (
          <button 
            className="btn btn-warning ms-3 position-relative"
            onClick={() => setFilters({...filters, status: 'pending'})}
          >
            View Pending Posts
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {pendingCount}
              <span className="visually-hidden">pending posts</span>
            </span>
          </button>
        )}
      </h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-md-9">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Blog Filters</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select 
                    className="form-select"
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select 
                    className="form-select"
                    id="category"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label htmlFor="author" className="form-label">Author</label>
                  <select 
                    className="form-select"
                    id="author"
                    name="author"
                    value={filters.author}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Authors</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button 
                className="btn btn-secondary"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="admin-sidebar mb-4">
            <div className="list-group">
              <Link className="list-group-item active" to="/admin/dashboard">
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </Link>
              <Link className="list-group-item" to="/admin/categories">
                <i className="fas fa-tags"></i> Manage Categories
              </Link>
              <Link className="list-group-item" to="/admin/users">
                <i className="fas fa-users"></i> Manage Users
              </Link>
              <Link className="list-group-item" to="/admin/user-activity">
                <i className="fas fa-file-alt"></i> User Activity Tracking
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Blogs {filters.status && `- ${filters.status.toUpperCase()}`}
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-4">
              <p>No blogs found with the selected filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Created At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map(blog => (
                    <tr key={blog._id}>
                      <td>
                        <Link to={`/blogs/${blog._id}`}>
                          {blog.title}
                        </Link>
                      </td>
                      <td>{blog.author.name}</td>
                      <td>{blog.category.name}</td>
                      <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span 
                          className={`badge ${
                            blog.status === 'approved' 
                              ? 'bg-success' 
                              : blog.status === 'pending' 
                                ? 'bg-warning' 
                                : 'bg-danger'
                          }`}
                        >
                          {blog.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          {blog.status !== 'approved' && (
                            <button 
                              className="btn btn-sm btn-success me-1"
                              onClick={() => handleStatusChange(blog._id, 'approved')}
                              disabled={statusLoading && selectedBlogId === blog._id}
                            >
                              {statusLoading && selectedBlogId === blog._id ? 
                                'Loading...' : 'Approve'}
                            </button>
                          )}
                          
                          {blog.status !== 'rejected' && (
                            <button 
                              className="btn btn-sm btn-danger me-1"
                              onClick={() => handleStatusChange(blog._id, 'rejected')}
                              disabled={statusLoading && selectedBlogId === blog._id}
                            >
                              {statusLoading && selectedBlogId === blog._id ? 
                                'Loading...' : 'Reject'}
                            </button>
                          )}
                          
                          <Link 
                            to={`/blogs/${blog._id}`} 
                            className="btn btn-sm btn-info me-1"
                            target="_blank"
                            state={{ adminPreview: true }}
                          >
                            <i className="bi bi-eye"></i> View
                          </Link>
                          
                          <Link 
                            to={`/blogs/edit/${blog._id}`} 
                            className="btn btn-sm btn-primary me-1"
                          >
                            Edit
                          </Link>
                          
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(blog._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 