import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
        
        // Fetch blogs (only approved will be returned for public)
        const blogsRes = await axios.get('/blogs', {
          params: selectedCategory ? { category: selectedCategory } : {}
        });
        
        // Fetch categories
        const categoriesRes = await axios.get('/categories');
        
        setBlogs(blogsRes.data.data);
        setCategories(categoriesRes.data.data);
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
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {blogs.length === 0 ? (
        <div className="text-center py-5">
          <h3>No blogs found</h3>
          <p>There are no published blogs in this category yet.</p>
        </div>
      ) : (
        <div className="row">
          {blogs.map(blog => (
            <div key={blog._id} className="col-md-4 mb-4">
              <div className="card h-100">
                {blog.featuredImage ? (
                  <img 
                    src={`http://localhost:5000${blog.featuredImage}`} 
                    className="card-img-top" 
                    alt={blog.title}
                    style={{ height: '200px', objectFit: 'cover' }}
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
                      Category: {blog.category.name} | By: {blog.author.name}
                    </small>
                  </p>
                  <Link to={`/blogs/${blog._id}`} className="btn btn-primary">
                    Read More
                  </Link>
                </div>
                <div className="card-footer text-muted">
                  <small>
                    {new Date(blog.createdAt).toLocaleDateString()} | 
                    <i className="bi bi-heart-fill ms-2 me-1"></i> {blog.likeCount} |
                    <i className="bi bi-chat-fill ms-2 me-1"></i> {blog.commentCount}
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