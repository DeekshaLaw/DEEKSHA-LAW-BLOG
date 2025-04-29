import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch blogs (explicitly request only approved blogs)
        const params = { status: 'approved' };
        
        // Add category filter if selected
        if (selectedCategory) {
          params.category = selectedCategory;
        }
        
        // Make API request with status=approved parameter
        const blogsRes = await axios.get('/blogs', { params });
        
        // Fetch categories
        const categoriesRes = await axios.get('/categories');
        
        setBlogs(blogsRes.data?.data || []);
        setCategories(categoriesRes.data?.data || []);
      } catch (err) {
        setError('Failed to load blogs. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCategory]);
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">DEEKSHA LAW BLOGS</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <div className="row">
          <div className="col-md-4 mb-3">
            <select 
              className="form-select" 
              value={selectedCategory} 
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              {Array.isArray(categories) && categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {(!blogs || blogs.length === 0) ? (
        <div className="text-center py-5">
          <h3>No blogs found</h3>
          <p>There are no published blogs in this category yet.</p>
        </div>
      ) : (
        <div className="row">
          {Array.isArray(blogs) && blogs.map(blog => (
            <div key={blog._id} className="col-md-4 mb-4">
              <div className="card h-100">
                {blog.featuredImage ? (
                  <img 
                    src={blog.featuredImage} 
                    className="card-img-top" 
                    alt={blog.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className="card-img-top" 
                    style={{ 
                      height: '200px', 
                      background: 'linear-gradient(to bottom right, #e9ecef, #adb5bd)',
                      borderBottom: '1px solid rgba(0,0,0,.125)'
                    }}
                  ></div>
                )}
                <div className="card-body">
                  <h5 className="card-title">{blog.title}</h5>
                  <p className="card-text text-muted">
                    <small>
                      Category: {blog.category?.name || 'Uncategorized'} | By: {blog.author?.name || 'Unknown'}
                    </small>
                  </p>
                  <Link to={`/blogs/${blog._id}`} className="btn btn-primary">
                    Read More
                  </Link>
                </div>
                <div className="card-footer text-muted">
                  <small>
                    {new Date(blog.createdAt).toLocaleDateString()} | 
                    <i className="bi bi-heart-fill ms-2 me-1"></i> {blog.likeCount || 0} |
                    <i className="bi bi-chat-fill ms-2 me-1"></i> {blog.commentCount || 0}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home; 