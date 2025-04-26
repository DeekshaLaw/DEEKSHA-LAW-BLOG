import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError('');
        
        const res = await axios.get(`/blogs/user/${activeTab}`);
        setBlogs(res.data.data);
      } catch (err) {
        setError('Failed to load blogs. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [activeTab]);
  
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
      <h1 className="mb-4">My Dashboard</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <Link to="/blogs/create" className="btn btn-primary">
          Create New Blog
        </Link>
      </div>
      
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                Approved Blogs
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Blogs
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                Rejected Blogs
              </button>
            </li>
          </ul>
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
              <p>No {activeTab} blogs found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
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
                        {blog.status === 'approved' ? (
                          <Link to={`/blogs/${blog._id}`}>{blog.title}</Link>
                        ) : (
                          blog.title
                        )}
                      </td>
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
                          <Link 
                            to={`/blogs/edit/${blog._id}`} 
                            className="btn btn-sm btn-outline-primary me-1"
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

export default Dashboard; 